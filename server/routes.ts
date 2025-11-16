import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "./auth";
import { storage } from "./storage";
import { requireAuth, requireManagerOrOwner } from "./auth";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertPersonnelSchema, 
  insertCustomerSchema,
  insertVenueSchema,
  insertContactSchema,
  insertGigSchema,
  insertPayoutSchema,
  insertGigInvoiceSchema,
} from "@shared/schema";

const PgSession = connectPgSimple(session);

// Validation middleware
function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Async handler wrapper
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure SESSION_SECRET is set
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set with a secure random string of at least 32 characters"
    );
  }

  // Session configuration
  app.use(
    session({
      store: new PgSession({
        conString: process.env.DATABASE_URL,
        createTableIfMissing: true,
        tableName: 'user_sessions',
      }),
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      },
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Set audit user for all authenticated requests
  app.use(asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user) {
      const userId = (req.user as any).id;
      await storage.setAuditUser(userId);
    } else {
      // Set system user for unauthenticated requests
      await storage.setAuditUser('00000000-0000-0000-0000-000000000000');
    }
    next();
  }));

  // ===== AUTHENTICATION ROUTES =====
  
  // Register
  app.post('/api/register', asyncHandler(async (req: Request, res: Response) => {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
    });

    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user account already exists for this email
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered" });
      }

      // Check if personnel record exists with matching email, firstName, and lastName
      const allPersonnel = await storage.getAllPersonnel();
      const matchingPersonnel = allPersonnel.find(
        (p) => 
          p.email?.toLowerCase() === data.email.toLowerCase() &&
          p.firstName.toLowerCase() === data.firstName.toLowerCase() &&
          p.lastName.toLowerCase() === data.lastName.toLowerCase()
      );

      if (!matchingPersonnel) {
        return res.status(403).json({ 
          error: "Unauthorized: No personnel record found matching your email and name. Please contact an administrator to be added to the personnel list before registering." 
        });
      }

      // Create user account linked to the existing personnel record
      const user = await storage.createUser({
        email: data.email,
        passwordHash: data.password,
        role: "personnel",
        personnelId: matchingPersonnel.id,
      });

      // Auto-login after registration
      req.login({
        id: user.id,
        email: user.email,
        role: user.role,
        personnelId: user.personnelId,
      }, (err) => {
        if (err) {
          return res.status(500).json({ error: "Registration successful but login failed" });
        }
        return res.json({
          id: user.id,
          email: user.email,
          role: user.role,
          personnelId: user.personnelId,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }));

  // Login
  app.post('/api/login', (req: Request, res: Response, next) => {
    console.log("Login attempt for:", req.body.email);
    passport.authenticate('local', (err: any, user: Express.User, info: any) => {
      if (err) {
        console.error("Login authentication error:", err);
        return res.status(500).json({ error: "Server error" });
      }
      if (!user) {
        console.log("Login failed - invalid credentials:", info);
        return res.status(401).json({ error: info?.message || "Invalid email or password" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login session error:", loginErr);
          return res.status(500).json({ error: "Login failed" });
        }
        console.log("Login successful for user:", user.email);
        return res.json({
          id: user.id,
          email: user.email,
          role: user.role,
          personnelId: user.personnelId,
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post('/api/logout', (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: "Session destruction failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ message: "Logout successful" });
      });
    });
  });

  // Get current user
  app.get('/api/user', (req: Request, res: Response) => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        personnelId: req.user.personnelId,
      });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // ===== PERSONNEL ROUTES =====
  
  app.get('/api/personnel', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const personnel = await storage.getAllPersonnel();
    res.json(personnel);
  }));

  app.get('/api/personnel/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const personnel = await storage.getPersonnel(req.params.id);
    if (!personnel) {
      return res.status(404).json({ error: "Personnel not found" });
    }
    res.json(personnel);
  }));

  app.post('/api/personnel', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const createUserAccount = req.body.createUserAccount !== false;
    const personnel = await storage.createPersonnel(req.body, createUserAccount);
    res.status(201).json(personnel);
  }));

  app.put('/api/personnel/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const personnel = await storage.updatePersonnel(req.params.id, req.body);
    if (!personnel) {
      return res.status(404).json({ error: "Personnel not found" });
    }
    res.json(personnel);
  }));

  app.delete('/api/personnel/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deletePersonnel(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Personnel not found" });
    }
    res.json({ message: "Personnel deleted successfully" });
  }));

  // Create user login for personnel
  app.post('/api/personnel/:id/create-login', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.body;
    const result = await storage.createPersonnelUserLogin(req.params.id, password);
    res.status(201).json(result);
  }));

  // ===== CUSTOMER ROUTES =====
  
  app.get('/api/customers', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const customers = await storage.getAllCustomers();
    res.json(customers);
  }));

  app.get('/api/customers/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const customer = await storage.getCustomer(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  }));

  app.post('/api/customers', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const customer = await storage.createCustomer(req.body);
    res.status(201).json(customer);
  }));

  app.put('/api/customers/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const customer = await storage.updateCustomer(req.params.id, req.body);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  }));

  app.delete('/api/customers/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteCustomer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  }));

  // Get contacts for a customer
  app.get('/api/customers/:id/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contacts = await storage.getContactsByCustomer(req.params.id);
    res.json(contacts);
  }));

  // Add or associate contact with customer
  app.post('/api/customers/:id/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { contactId, ...contactData } = req.body;
    
    if (contactId) {
      // Associate existing contact
      await storage.associateContactWithCustomer(contactId, req.params.id, req.body.roleId);
      const contact = await storage.getContact(contactId);
      res.json({ contact, isExisting: true });
    } else {
      // Find or create contact
      const result = await storage.findOrCreateContact(contactData);
      // Associate with customer
      await storage.associateContactWithCustomer(result.contact.id, req.params.id, req.body.roleId);
      res.status(result.isExisting ? 200 : 201).json(result);
    }
  }));

  // Remove contact from customer
  app.delete('/api/customers/:customerId/contacts/:contactId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    await storage.removeContactFromCustomer(req.params.contactId, req.params.customerId);
    res.json({ message: "Contact removed from customer" });
  }));

  // ===== VENUE ROUTES =====
  
  app.get('/api/venues', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const venues = await storage.getAllVenues();
    res.json(venues);
  }));

  app.get('/api/venues/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const venue = await storage.getVenue(req.params.id);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json(venue);
  }));

  app.post('/api/venues', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const venue = await storage.createVenue(req.body);
    res.status(201).json(venue);
  }));

  app.put('/api/venues/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const venue = await storage.updateVenue(req.params.id, req.body);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json(venue);
  }));

  app.delete('/api/venues/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteVenue(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json({ message: "Venue deleted successfully" });
  }));

  // Get contacts for a venue
  app.get('/api/venues/:id/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contacts = await storage.getContactsByVenue(req.params.id);
    res.json(contacts);
  }));

  // Add or associate contact with venue
  app.post('/api/venues/:id/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { contactId, ...contactData } = req.body;
    
    if (contactId) {
      // Associate existing contact
      await storage.associateContactWithVenue(contactId, req.params.id, req.body.roleId);
      const contact = await storage.getContact(contactId);
      res.json({ contact, isExisting: true });
    } else {
      // Find or create contact
      const result = await storage.findOrCreateContact(contactData);
      // Associate with venue
      await storage.associateContactWithVenue(result.contact.id, req.params.id, req.body.roleId);
      res.status(result.isExisting ? 200 : 201).json(result);
    }
  }));

  // Remove contact from venue
  app.delete('/api/venues/:venueId/contacts/:contactId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    await storage.removeContactFromVenue(req.params.contactId, req.params.venueId);
    res.json({ message: "Contact removed from venue" });
  }));

  // ===== CONTACT ROUTES =====
  
  app.get('/api/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contacts = await storage.getAllContacts();
    res.json(contacts);
  }));

  app.get('/api/contacts/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contact = await storage.getContact(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json(contact);
  }));

  app.post('/api/contacts', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contact = await storage.createContact(req.body);
    res.status(201).json(contact);
  }));

  app.put('/api/contacts/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const contact = await storage.updateContact(req.params.id, req.body);
    if (!contact) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json(contact);
  }));

  app.delete('/api/contacts/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteContact(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Contact not found" });
    }
    res.json({ message: "Contact deleted successfully" });
  }));

  // ===== GIG ROUTES =====
  
  app.get('/api/gigs', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const gigs = await storage.getAllGigs();
    res.json(gigs);
  }));

  app.get('/api/gigs/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const gig = await storage.getGig(req.params.id);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }
    res.json(gig);
  }));

  app.post('/api/gigs', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Convert ISO string timestamps to Date objects
    const gigData = {
      ...req.body,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
    };
    const gig = await storage.createGig(gigData);
    res.status(201).json(gig);
  }));

  app.put('/api/gigs/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Convert ISO string timestamps to Date objects
    const gigData = {
      ...req.body,
      startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
    };
    const gig = await storage.updateGig(req.params.id, gigData);
    if (!gig) {
      return res.status(404).json({ error: "Gig not found" });
    }
    res.json(gig);
  }));

  app.delete('/api/gigs/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteGig(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Gig not found" });
    }
    res.json({ message: "Gig deleted successfully" });
  }));

  // Assign personnel to gig
  app.post('/api/gigs/:id/assign-personnel', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const { personnelIds } = req.body;
    if (!Array.isArray(personnelIds)) {
      return res.status(400).json({ error: "personnelIds must be an array" });
    }
    await storage.assignPersonnelToGig(req.params.id, personnelIds);
    res.json({ message: "Personnel assigned successfully" });
  }));

  // Get personnel assigned to gig
  app.get('/api/gigs/:id/personnel', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const personnel = await storage.getGigPersonnel(req.params.id);
    res.json(personnel);
  }));

  // ===== LOOKUP TABLE ROUTES =====
  
  // Venue Types
  app.get('/api/venue-types', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getAllVenueTypes();
    res.json(types);
  }));

  app.post('/api/venue-types', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.createVenueType(req.body.name);
    res.status(201).json(type);
  }));

  app.put('/api/venue-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.updateVenueType(req.params.id, req.body.name);
    if (!type) {
      return res.status(404).json({ error: "Venue type not found" });
    }
    res.json(type);
  }));

  app.delete('/api/venue-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteVenueType(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Venue type not found" });
    }
    res.json({ message: "Venue type deleted successfully" });
  }));

  // Personnel Types
  app.get('/api/personnel-types', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getAllPersonnelTypes();
    res.json(types);
  }));

  app.post('/api/personnel-types', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.createPersonnelType(req.body.name);
    res.status(201).json(type);
  }));

  app.put('/api/personnel-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.updatePersonnelType(req.params.id, req.body.name);
    if (!type) {
      return res.status(404).json({ error: "Personnel type not found" });
    }
    res.json(type);
  }));

  app.delete('/api/personnel-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deletePersonnelType(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Personnel type not found" });
    }
    res.json({ message: "Personnel type deleted successfully" });
  }));

  // Gig Types
  app.get('/api/gig-types', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getAllGigTypes();
    res.json(types);
  }));

  app.post('/api/gig-types', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.createGigType(req.body.name);
    res.status(201).json(type);
  }));

  app.put('/api/gig-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.updateGigType(req.params.id, req.body.name);
    if (!type) {
      return res.status(404).json({ error: "Gig type not found" });
    }
    res.json(type);
  }));

  app.delete('/api/gig-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteGigType(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Gig type not found" });
    }
    res.json({ message: "Gig type deleted successfully" });
  }));

  // Contact Roles
  app.get('/api/contact-roles', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const roles = await storage.getAllContactRoles();
    res.json(roles);
  }));

  app.post('/api/contact-roles', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const role = await storage.createContactRole(req.body.name);
    res.status(201).json(role);
  }));

  app.put('/api/contact-roles/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const role = await storage.updateContactRole(req.params.id, req.body.name);
    if (!role) {
      return res.status(404).json({ error: "Contact role not found" });
    }
    res.json(role);
  }));

  app.delete('/api/contact-roles/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteContactRole(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Contact role not found" });
    }
    res.json({ message: "Contact role deleted successfully" });
  }));

  // Payment Methods
  app.get('/api/payment-methods', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const methods = await storage.getAllPaymentMethods();
    res.json(methods);
  }));

  app.post('/api/payment-methods', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const method = await storage.createPaymentMethod(req.body.name);
    res.status(201).json(method);
  }));

  app.put('/api/payment-methods/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const method = await storage.updatePaymentMethod(req.params.id, req.body.name);
    if (!method) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    res.json(method);
  }));

  app.delete('/api/payment-methods/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deletePaymentMethod(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Payment method not found" });
    }
    res.json({ message: "Payment method deleted successfully" });
  }));

  // File Management Routes
  app.get('/api/files', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // Return mock file data for now
    const mockFiles = [
      {
        id: "1",
        fileName: "DJ_Contract_Template.pdf",
        fileType: "application/pdf",
        fileSize: 245678,
        category: "contract",
        description: "Standard DJ service contract template",
        uploadedBy: req.user?.email || "admin",
        uploadedAt: new Date("2024-01-15").toISOString(),
      },
      {
        id: "2",
        fileName: "Venue_Agreement_StarLight.pdf",
        fileType: "application/pdf",
        fileSize: 189456,
        category: "agreement",
        description: "Venue partnership agreement with StarLight Ballroom",
        uploadedBy: req.user?.email || "admin",
        uploadedAt: new Date("2024-02-01").toISOString(),
      },
    ];
    res.json(mockFiles);
  }));

  app.post('/api/files/upload', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // Mock file upload - in production would use multer and store files
    res.json({
      id: Date.now().toString(),
      fileName: "uploaded_file.pdf",
      fileType: "application/pdf",
      fileSize: 123456,
      category: req.body.category || "other",
      description: req.body.description,
      uploadedBy: req.user?.email || "unknown",
      uploadedAt: new Date().toISOString(),
    });
  }));

  app.get('/api/files/:id/preview', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // In production, would serve the actual file
    res.status(501).json({ error: "Preview not yet implemented" });
  }));

  app.get('/api/files/:id/download', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // In production, would serve the actual file for download
    res.status(501).json({ error: "Download not yet implemented" });
  }));

  app.delete('/api/files/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // Mock delete - in production would delete from storage
    res.json({ message: "File deleted successfully" });
  }));

  // Check-in/out Routes for Personnel
  app.get('/api/my-gigs/today', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // Get personnel ID from user
    const personnel = await storage.getPersonnelByEmail(req.user.email);
    if (!personnel) return res.status(404).json({ error: "Personnel not found" });
    
    // Get today's gigs for this personnel
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const allGigs = await storage.getAllGigs();
    const todaysGigs = allGigs.filter(gig => {
      const startTime = new Date(gig.startTime);
      return startTime >= today && startTime < tomorrow;
    });
    
    // TODO: Filter by assigned personnel when gig_personnel relationship is available
    res.json(todaysGigs);
  }));

  app.get('/api/my-check-ins', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    // Get personnel ID from user
    const personnel = await storage.getPersonnelByEmail(req.user.email);
    if (!personnel) return res.status(404).json({ error: "Personnel not found" });
    
    // Get check-ins for this personnel (using existing invoice table temporarily)
    // TODO: Use actual check-ins table when available
    res.json([]);
  }));

  app.post('/api/gigs/:id/check-in', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const personnel = await storage.getPersonnelByEmail(req.user.email);
    if (!personnel) return res.status(404).json({ error: "Personnel not found" });
    
    const { checkInTime, checkInLocation, notes } = req.body;
    
    // TODO: Store check-in data when check-ins table is available
    // For now, just return success
    res.json({
      gigId: req.params.id,
      personnelId: personnel.id,
      checkInTime,
      checkInLocation,
      notes
    });
  }));

  app.post('/api/gigs/:id/check-out', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const personnel = await storage.getPersonnelByEmail(req.user.email);
    if (!personnel) return res.status(404).json({ error: "Personnel not found" });
    
    const { checkOutTime, checkOutLocation, notes } = req.body;
    
    // TODO: Update check-in record with check-out data when table is available
    res.json({
      gigId: req.params.id,
      personnelId: personnel.id,
      checkOutTime,
      checkOutLocation,
      notes
    });
  }));

  // Invoice Routes
  app.get('/api/invoices', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    // For now, return invoices from gigInvoices table
    const invoices = await storage.getAllGigInvoices();
    res.json(invoices);
  }));

  app.post('/api/invoices', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const { gigId, externalInvoiceId, amount, status = 'draft', issueDate, dueDate, externalInvoiceUrl, customerId, invoiceNumber } = req.body;
    
    // Create a gig invoice for now
    const invoice = await storage.createGigInvoice({
      gigId: gigId || null,
      externalInvoiceId: invoiceNumber || externalInvoiceId || `INV-${Date.now()}`,
      externalInvoiceUrl: externalInvoiceUrl || null,
      amount: amount.toString(),
      status: status,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    
    res.status(201).json(invoice);
  }));

  app.put('/api/invoices/:id/status', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const invoice = await storage.updateGigInvoiceStatus(req.params.id, status);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  }));

  // Document Types
  app.get('/api/document-types', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    const types = await storage.getAllDocumentTypes();
    res.json(types);
  }));

  app.post('/api/document-types', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.createDocumentType(req.body.name);
    res.status(201).json(type);
  }));

  app.put('/api/document-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const type = await storage.updateDocumentType(req.params.id, req.body.name);
    if (!type) {
      return res.status(404).json({ error: "Document type not found" });
    }
    res.json(type);
  }));

  app.delete('/api/document-types/:id', requireManagerOrOwner, asyncHandler(async (req: Request, res: Response) => {
    const success = await storage.deleteDocumentType(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Document type not found" });
    }
    res.json({ message: "Document type deleted successfully" });
  }));

  // ===== SQUARE INTEGRATION ROUTES =====
  
  // Get Square configuration
  app.get('/api/integrations/square', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Only owner can view Square config
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const config = await storage.getSquareConfig();
    if (!config) {
      return res.status(404).json({ error: "Square integration not configured" });
    }
    res.json(config);
  }));

  // Create or update Square configuration
  app.post('/api/integrations/square', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Only owner can configure Square
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const config = await storage.createOrUpdateSquareConfig(req.body);
    res.json(config);
  }));

  app.put('/api/integrations/square/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Only owner can configure Square
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const config = await storage.updateSquareConfig(req.params.id, req.body);
    if (!config) {
      return res.status(404).json({ error: "Square configuration not found" });
    }
    res.json(config);
  }));

  // Test Square connection
  app.post('/api/integrations/square/test', requireAuth, asyncHandler(async (req: Request, res: Response) => {
    // Only owner can test Square connection
    if (req.user?.role !== 'owner') {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    const result = await storage.testSquareConnection(req.body.accessToken, req.body.environment);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  }));

  // Error handling middleware (should be last)
  app.use((err: any, req: Request, res: Response, next: Function) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal server error",
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}