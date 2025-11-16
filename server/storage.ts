import { db, pool } from "./db";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import * as schema from "@shared/schema";
import bcrypt from "bcryptjs";

// Types
type User = schema.User;
type InsertUser = schema.InsertUser;
type Personnel = schema.Personnel;
type InsertPersonnel = schema.InsertPersonnel;
type Customer = schema.Customer;
type InsertCustomer = schema.InsertCustomer;
type Venue = schema.Venue;
type InsertVenue = schema.InsertVenue;
type Contact = schema.Contact;
type InsertContact = schema.InsertContact;
type Gig = schema.Gig;
type InsertGig = schema.InsertGig;
type PersonnelPayout = schema.PersonnelPayout;
type InsertPersonnelPayout = schema.InsertPersonnelPayout;
type GigInvoice = schema.GigInvoice;
type InsertGigInvoice = schema.InsertGigInvoice;
type PersonnelFile = schema.PersonnelFile;
type InsertPersonnelFile = schema.InsertPersonnelFile;

// Lookup types
type VenueType = schema.VenueType;
type PersonnelType = schema.PersonnelType;
type GigType = schema.GigType;
type PaymentMethod = schema.PaymentMethod;
type DocumentType = schema.DocumentType;
type ContactRole = schema.ContactRole;

export interface IStorage {
  // Set audit user for the current transaction
  setAuditUser(userId: string): Promise<void>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyPassword(username: string, password: string): Promise<User | undefined>;

  // Personnel methods
  getPersonnel(id: string): Promise<Personnel | undefined>;
  getPersonnelByUserId(userId: string): Promise<Personnel | undefined>;
  getPersonnelByEmail(email: string): Promise<Personnel | undefined>;
  getAllPersonnel(): Promise<Personnel[]>;
  createPersonnel(personnel: InsertPersonnel, createUserAccount?: boolean): Promise<Personnel>;
  updatePersonnel(id: string, personnel: Partial<InsertPersonnel>): Promise<Personnel | undefined>;
  deletePersonnel(id: string): Promise<boolean>;

  // Customer methods
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Venue methods
  getVenue(id: string): Promise<Venue | undefined>;
  getAllVenues(): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: string): Promise<boolean>;

  // Contact methods
  getContact(id: string): Promise<Contact | undefined>;
  getAllContacts(): Promise<Contact[]>;
  getContactsByCustomer(customerId: string): Promise<Contact[]>;
  getContactsByVenue(venueId: string): Promise<Contact[]>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: string): Promise<boolean>;

  // Gig methods
  getGig(id: string): Promise<Gig | undefined>;
  getAllGigs(): Promise<Gig[]>;
  getGigsByCustomer(customerId: string): Promise<Gig[]>;
  getGigsByVenue(venueId: string): Promise<Gig[]>;
  getGigsByPersonnel(personnelId: string): Promise<Gig[]>;
  createGig(gig: InsertGig): Promise<Gig>;
  updateGig(id: string, gig: Partial<InsertGig>): Promise<Gig | undefined>;
  deleteGig(id: string): Promise<boolean>;
  
  // Gig Personnel Assignment
  assignPersonnelToGig(gigId: string, personnelIds: string[]): Promise<void>;
  getGigPersonnel(gigId: string): Promise<Personnel[]>;

  // Payout methods
  getPayoutsByGig(gigId: string): Promise<PersonnelPayout[]>;
  getPayoutsByPersonnel(personnelId: string): Promise<PersonnelPayout[]>;
  createPayout(payout: InsertPersonnelPayout): Promise<PersonnelPayout>;
  updatePayout(id: string, payout: Partial<InsertPersonnelPayout>): Promise<PersonnelPayout | undefined>;
  deletePayout(id: string): Promise<boolean>;

  // Invoice methods
  getInvoicesByGig(gigId: string): Promise<GigInvoice[]>;
  createInvoice(invoice: InsertGigInvoice): Promise<GigInvoice>;
  updateInvoice(id: string, invoice: Partial<InsertGigInvoice>): Promise<GigInvoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  getAllGigInvoices(): Promise<GigInvoice[]>;
  createGigInvoice(invoice: any): Promise<GigInvoice>;
  updateGigInvoiceStatus(id: string, status: string): Promise<GigInvoice | undefined>;

  // File methods
  getFilesByPersonnel(personnelId: string): Promise<PersonnelFile[]>;
  createFile(file: InsertPersonnelFile): Promise<PersonnelFile>;
  deleteFile(id: string): Promise<boolean>;

  // Lookup table methods
  getAllVenueTypes(): Promise<VenueType[]>;
  createVenueType(name: string): Promise<VenueType>;
  updateVenueType(id: string, name: string): Promise<VenueType | undefined>;
  deleteVenueType(id: string): Promise<boolean>;

  getAllPersonnelTypes(): Promise<PersonnelType[]>;
  createPersonnelType(name: string): Promise<PersonnelType>;
  updatePersonnelType(id: string, name: string): Promise<PersonnelType | undefined>;
  deletePersonnelType(id: string): Promise<boolean>;

  getAllGigTypes(): Promise<GigType[]>;
  createGigType(name: string): Promise<GigType>;
  updateGigType(id: string, name: string): Promise<GigType | undefined>;
  deleteGigType(id: string): Promise<boolean>;

  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(name: string): Promise<PaymentMethod>;
  updatePaymentMethod(id: string, name: string): Promise<PaymentMethod | undefined>;
  deletePaymentMethod(id: string): Promise<boolean>;

  getAllDocumentTypes(): Promise<DocumentType[]>;
  createDocumentType(name: string): Promise<DocumentType>;
  updateDocumentType(id: string, name: string): Promise<DocumentType | undefined>;
  deleteDocumentType(id: string): Promise<boolean>;

  getAllContactRoles(): Promise<ContactRole[]>;
  createContactRole(name: string): Promise<ContactRole>;
  updateContactRole(id: string, name: string): Promise<ContactRole | undefined>;
  deleteContactRole(id: string): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  private currentUserId: string | null = null;

  async setAuditUser(userId: string): Promise<void> {
    this.currentUserId = userId;
    // Set the session variable for audit logging
    await db.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Since there's no username column, we use email as username
    return this.getUserByEmail(username);
  }

  async createUser(user: InsertUser & { password?: string, username?: string }): Promise<User> {
    // Remove password and username from the object to insert, handle password hashing
    const { password, username, ...userToInsert } = user;
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    
    const [createdUser] = await db
      .insert(schema.users)
      .values({ ...userToInsert, passwordHash: hashedPassword })
      .returning();
    return createdUser;
  }

  async updateUser(id: string, user: Partial<InsertUser> & { password?: string }): Promise<User | undefined> {
    const { password, ...userToUpdate } = user;
    if (password) {
      userToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    const [updatedUser] = await db
      .update(schema.users)
      .set(userToUpdate)
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  async verifyPassword(emailOrUsername: string, password: string): Promise<User | undefined> {
    // Try to find user by email first, then username (which doesn't exist in DB)
    let user = await this.getUserByEmail(emailOrUsername);
    if (!user || !user.passwordHash) return undefined;
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return undefined;
    
    return user;
  }

  // Personnel methods
  async getPersonnel(id: string): Promise<Personnel | undefined> {
    const [personnel] = await db
      .select()
      .from(schema.personnel)
      .where(eq(schema.personnel.id, id));
    return personnel;
  }

  async getPersonnelByUserId(userId: string): Promise<Personnel | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));
    
    if (!user || !user.personnelId) return undefined;
    
    return await this.getPersonnel(user.personnelId);
  }

  async getPersonnelByEmail(email: string): Promise<Personnel | undefined> {
    const [personnel] = await db
      .select()
      .from(schema.personnel)
      .where(eq(schema.personnel.email, email));
    return personnel;
  }

  async getAllPersonnel(): Promise<Personnel[]> {
    return await db
      .select()
      .from(schema.personnel)
      .orderBy(desc(schema.personnel.createdAt));
  }

  async createPersonnel(personnel: InsertPersonnel, createUserAccount = true): Promise<Personnel> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create personnel record
      const [createdPersonnel] = await tx
        .insert(schema.personnel)
        .values(personnel)
        .returning();

      // Optionally create user account
      if (createUserAccount && personnel.email) {
        const existingUser = await this.getUserByEmail(personnel.email);
        if (!existingUser) {
          await tx
            .insert(schema.users)
            .values({
              email: personnel.email,
              passwordHash: null, // They'll set it on first login
              role: "personnel",
              personnelId: createdPersonnel.id,
            })
            .returning();
        }
      }

      return createdPersonnel;
    });
  }

  async updatePersonnel(id: string, personnel: Partial<InsertPersonnel>): Promise<Personnel | undefined> {
    const [updated] = await db
      .update(schema.personnel)
      .set(personnel)
      .where(eq(schema.personnel.id, id))
      .returning();
    return updated;
  }

  async deletePersonnel(id: string): Promise<boolean> {
    const result = await db
      .delete(schema.personnel)
      .where(eq(schema.personnel.id, id));
    return true;
  }

  // Customer methods
  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id));
    return customer;
  }

  async getAllCustomers(): Promise<Customer[]> {
    return await db
      .select()
      .from(schema.customers)
      .orderBy(desc(schema.customers.createdAt));
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [created] = await db
      .insert(schema.customers)
      .values(customer)
      .returning();
    return created;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updated] = await db
      .update(schema.customers)
      .set(customer)
      .where(eq(schema.customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    await db.delete(schema.customers).where(eq(schema.customers.id, id));
    return true;
  }

  // Venue methods
  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db
      .select()
      .from(schema.venues)
      .where(eq(schema.venues.id, id));
    return venue;
  }

  async getAllVenues(): Promise<Venue[]> {
    return await db
      .select()
      .from(schema.venues)
      .orderBy(desc(schema.venues.createdAt));
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [created] = await db
      .insert(schema.venues)
      .values(venue)
      .returning();
    return created;
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updated] = await db
      .update(schema.venues)
      .set(venue)
      .where(eq(schema.venues.id, id))
      .returning();
    return updated;
  }

  async deleteVenue(id: string): Promise<boolean> {
    await db.delete(schema.venues).where(eq(schema.venues.id, id));
    return true;
  }

  // Contact methods
  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db
      .select()
      .from(schema.contacts)
      .where(eq(schema.contacts.id, id));
    return contact;
  }

  async getAllContacts(): Promise<Contact[]> {
    return await db
      .select()
      .from(schema.contacts)
      .orderBy(desc(schema.contacts.createdAt));
  }

  async getContactsByCustomer(customerId: string): Promise<Contact[]> {
    const contactCustomers = await db
      .select()
      .from(schema.customerContacts)
      .where(eq(schema.customerContacts.customerId, customerId));

    if (contactCustomers.length === 0) return [];

    return await db
      .select()
      .from(schema.contacts)
      .where(inArray(schema.contacts.id, contactCustomers.map(cc => cc.contactId)));
  }

  async getContactsByVenue(venueId: string): Promise<Contact[]> {
    const contactVenues = await db
      .select()
      .from(schema.venueContacts)
      .where(eq(schema.venueContacts.venueId, venueId));

    if (contactVenues.length === 0) return [];

    return await db
      .select()
      .from(schema.contacts)
      .where(inArray(schema.contacts.id, contactVenues.map(cv => cv.contactId)));
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const [created] = await db
      .insert(schema.contacts)
      .values(contact)
      .returning();
    return created;
  }

  async updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(schema.contacts)
      .set(contact)
      .where(eq(schema.contacts.id, id))
      .returning();
    return updated;
  }

  async deleteContact(id: string): Promise<boolean> {
    await db.delete(schema.contacts).where(eq(schema.contacts.id, id));
    return true;
  }

  // Gig methods
  async getGig(id: string): Promise<Gig | undefined> {
    const [gig] = await db
      .select()
      .from(schema.gigs)
      .where(eq(schema.gigs.id, id));
    return gig;
  }

  async getAllGigs(): Promise<Gig[]> {
    return await db
      .select()
      .from(schema.gigs)
      .orderBy(desc(schema.gigs.startTime));
  }

  async getGigsByCustomer(customerId: string): Promise<Gig[]> {
    return await db
      .select()
      .from(schema.gigs)
      .where(eq(schema.gigs.customerId, customerId))
      .orderBy(desc(schema.gigs.startTime));
  }

  async getGigsByVenue(venueId: string): Promise<Gig[]> {
    return await db
      .select()
      .from(schema.gigs)
      .where(eq(schema.gigs.venueId, venueId))
      .orderBy(desc(schema.gigs.startTime));
  }

  async getGigsByPersonnel(personnelId: string): Promise<Gig[]> {
    const gigPersonnel = await db
      .select()
      .from(schema.gigPersonnel)
      .where(eq(schema.gigPersonnel.personnelId, personnelId));

    if (gigPersonnel.length === 0) return [];

    return await db
      .select()
      .from(schema.gigs)
      .where(inArray(schema.gigs.id, gigPersonnel.map(gp => gp.gigId)))
      .orderBy(desc(schema.gigs.startTime));
  }

  async createGig(gig: InsertGig): Promise<Gig> {
    const [created] = await db
      .insert(schema.gigs)
      .values(gig)
      .returning();
    return created;
  }

  async updateGig(id: string, gig: Partial<InsertGig>): Promise<Gig | undefined> {
    const [updated] = await db
      .update(schema.gigs)
      .set(gig)
      .where(eq(schema.gigs.id, id))
      .returning();
    return updated;
  }

  async deleteGig(id: string): Promise<boolean> {
    await db.delete(schema.gigs).where(eq(schema.gigs.id, id));
    return true;
  }

  async assignPersonnelToGig(gigId: string, personnelIds: string[]): Promise<void> {
    // Remove existing assignments
    await db
      .delete(schema.gigPersonnel)
      .where(eq(schema.gigPersonnel.gigId, gigId));

    // Add new assignments
    if (personnelIds.length > 0) {
      await db
        .insert(schema.gigPersonnel)
        .values(personnelIds.map(personnelId => ({ gigId, personnelId })));
    }
  }

  async getGigPersonnel(gigId: string): Promise<Personnel[]> {
    const gigPersonnelRecords = await db
      .select()
      .from(schema.gigPersonnel)
      .where(eq(schema.gigPersonnel.gigId, gigId));

    if (gigPersonnelRecords.length === 0) return [];

    return await db
      .select()
      .from(schema.personnel)
      .where(inArray(schema.personnel.id, gigPersonnelRecords.map(gp => gp.personnelId)));
  }

  // Payout methods
  async getPayoutsByGig(gigId: string): Promise<PersonnelPayout[]> {
    return await db
      .select()
      .from(schema.personnelPayouts)
      .where(eq(schema.personnelPayouts.gigId, gigId))
      .orderBy(desc(schema.personnelPayouts.datePaid));
  }

  async getPayoutsByPersonnel(personnelId: string): Promise<PersonnelPayout[]> {
    return await db
      .select()
      .from(schema.personnelPayouts)
      .where(eq(schema.personnelPayouts.personnelId, personnelId))
      .orderBy(desc(schema.personnelPayouts.datePaid));
  }

  async createPayout(payout: InsertPersonnelPayout): Promise<PersonnelPayout> {
    const [created] = await db
      .insert(schema.personnelPayouts)
      .values(payout)
      .returning();
    return created;
  }

  async updatePayout(id: string, payout: Partial<InsertPersonnelPayout>): Promise<PersonnelPayout | undefined> {
    const [updated] = await db
      .update(schema.personnelPayouts)
      .set(payout)
      .where(eq(schema.personnelPayouts.id, id))
      .returning();
    return updated;
  }

  async deletePayout(id: string): Promise<boolean> {
    await db
      .delete(schema.personnelPayouts)
      .where(eq(schema.personnelPayouts.id, id));
    return true;
  }

  // Invoice methods
  async getInvoicesByGig(gigId: string): Promise<GigInvoice[]> {
    return await db
      .select()
      .from(schema.gigInvoices)
      .where(eq(schema.gigInvoices.gigId, gigId));
  }

  async createInvoice(invoice: InsertGigInvoice): Promise<GigInvoice> {
    const [created] = await db
      .insert(schema.gigInvoices)
      .values(invoice)
      .returning();
    return created;
  }

  async updateInvoice(id: string, invoice: Partial<InsertGigInvoice>): Promise<GigInvoice | undefined> {
    const [updated] = await db
      .update(schema.gigInvoices)
      .set(invoice)
      .where(eq(schema.gigInvoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    await db
      .delete(schema.gigInvoices)
      .where(eq(schema.gigInvoices.id, id));
    return true;
  }

  async getAllGigInvoices(): Promise<GigInvoice[]> {
    return await db.select().from(schema.gigInvoices);
  }

  async createGigInvoice(invoice: any): Promise<GigInvoice> {
    const [created] = await db
      .insert(schema.gigInvoices)
      .values(invoice)
      .returning();
    return created;
  }

  async updateGigInvoiceStatus(id: string, status: string): Promise<GigInvoice | undefined> {
    const [updated] = await db
      .update(schema.gigInvoices)
      .set({ status })
      .where(eq(schema.gigInvoices.id, id))
      .returning();
    return updated;
  }

  // File methods
  async getFilesByPersonnel(personnelId: string): Promise<PersonnelFile[]> {
    return await db
      .select()
      .from(schema.personnelFiles)
      .where(eq(schema.personnelFiles.personnelId, personnelId))
      .orderBy(desc(schema.personnelFiles.uploadedAt));
  }

  async createFile(file: InsertPersonnelFile): Promise<PersonnelFile> {
    const [created] = await db
      .insert(schema.personnelFiles)
      .values(file)
      .returning();
    return created;
  }

  async deleteFile(id: string): Promise<boolean> {
    await db
      .delete(schema.personnelFiles)
      .where(eq(schema.personnelFiles.id, id));
    return true;
  }

  // Lookup table methods
  async getAllVenueTypes(): Promise<VenueType[]> {
    return await db.select().from(schema.venueTypes);
  }

  async createVenueType(name: string): Promise<VenueType> {
    const [created] = await db
      .insert(schema.venueTypes)
      .values({ name })
      .returning();
    return created;
  }

  async updateVenueType(id: string, name: string): Promise<VenueType | undefined> {
    const [updated] = await db
      .update(schema.venueTypes)
      .set({ name })
      .where(eq(schema.venueTypes.id, id))
      .returning();
    return updated;
  }

  async deleteVenueType(id: string): Promise<boolean> {
    await db.delete(schema.venueTypes).where(eq(schema.venueTypes.id, id));
    return true;
  }

  async getAllPersonnelTypes(): Promise<PersonnelType[]> {
    return await db.select().from(schema.personnelTypes);
  }

  async createPersonnelType(name: string): Promise<PersonnelType> {
    const [created] = await db
      .insert(schema.personnelTypes)
      .values({ name })
      .returning();
    return created;
  }

  async updatePersonnelType(id: string, name: string): Promise<PersonnelType | undefined> {
    const [updated] = await db
      .update(schema.personnelTypes)
      .set({ name })
      .where(eq(schema.personnelTypes.id, id))
      .returning();
    return updated;
  }

  async deletePersonnelType(id: string): Promise<boolean> {
    await db.delete(schema.personnelTypes).where(eq(schema.personnelTypes.id, id));
    return true;
  }

  async getAllGigTypes(): Promise<GigType[]> {
    return await db.select().from(schema.gigTypes);
  }

  async createGigType(name: string): Promise<GigType> {
    const [created] = await db
      .insert(schema.gigTypes)
      .values({ name })
      .returning();
    return created;
  }

  async updateGigType(id: string, name: string): Promise<GigType | undefined> {
    const [updated] = await db
      .update(schema.gigTypes)
      .set({ name })
      .where(eq(schema.gigTypes.id, id))
      .returning();
    return updated;
  }

  async deleteGigType(id: string): Promise<boolean> {
    await db.delete(schema.gigTypes).where(eq(schema.gigTypes.id, id));
    return true;
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return await db.select().from(schema.paymentMethods);
  }

  async createPaymentMethod(name: string): Promise<PaymentMethod> {
    const [created] = await db
      .insert(schema.paymentMethods)
      .values({ name })
      .returning();
    return created;
  }

  async updatePaymentMethod(id: string, name: string): Promise<PaymentMethod | undefined> {
    const [updated] = await db
      .update(schema.paymentMethods)
      .set({ name })
      .where(eq(schema.paymentMethods.id, id))
      .returning();
    return updated;
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    await db.delete(schema.paymentMethods).where(eq(schema.paymentMethods.id, id));
    return true;
  }

  async getAllDocumentTypes(): Promise<DocumentType[]> {
    return await db.select().from(schema.documentTypes);
  }

  async createDocumentType(name: string): Promise<DocumentType> {
    const [created] = await db
      .insert(schema.documentTypes)
      .values({ name })
      .returning();
    return created;
  }

  async updateDocumentType(id: string, name: string): Promise<DocumentType | undefined> {
    const [updated] = await db
      .update(schema.documentTypes)
      .set({ name })
      .where(eq(schema.documentTypes.id, id))
      .returning();
    return updated;
  }

  async deleteDocumentType(id: string): Promise<boolean> {
    await db.delete(schema.documentTypes).where(eq(schema.documentTypes.id, id));
    return true;
  }

  async getAllContactRoles(): Promise<ContactRole[]> {
    return await db.select().from(schema.contactRoles);
  }

  async createContactRole(name: string): Promise<ContactRole> {
    const [created] = await db
      .insert(schema.contactRoles)
      .values({ name })
      .returning();
    return created;
  }

  async updateContactRole(id: string, name: string): Promise<ContactRole | undefined> {
    const [updated] = await db
      .update(schema.contactRoles)
      .set({ name })
      .where(eq(schema.contactRoles.id, id))
      .returning();
    return updated;
  }

  async deleteContactRole(id: string): Promise<boolean> {
    await db.delete(schema.contactRoles).where(eq(schema.contactRoles.id, id));
    return true;
  }
}

// Use PostgreSQL storage instead of memory storage
export const storage = new PostgresStorage();