import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";
import { User } from "@shared/schema";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: "owner" | "manager" | "personnel";
      personnelId?: string | null;
    }
  }
}

// Configure Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        // Verify password (which will find user by email)
        const validUser = await storage.verifyPassword(email, password);
        if (!validUser) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, {
          id: validUser.id,
          email: validUser.email,
          role: validUser.role,
          personnelId: validUser.personnelId,
        });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    done(null, {
      id: user.id,
      email: user.email,
      role: user.role,
      personnelId: user.personnelId,
    });
  } catch (error) {
    done(error);
  }
});

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Role-based authorization middleware
export function requireRole(...roles: Array<"owner" | "manager" | "personnel">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}

// Check if user has manager or owner role
export function requireManagerOrOwner(req: Request, res: Response, next: NextFunction) {
  return requireRole("owner", "manager")(req, res, next);
}

export default passport;