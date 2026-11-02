import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { AdminUser } from "@shared/schema";

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const admin = await storage.getAdminByEmail(email.toLowerCase());
        
        if (!admin) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isValid = await bcrypt.compare(password, admin.passwordHash);
        
        if (!isValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        return done(null, admin);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, (user as AdminUser).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const admin = await storage.getAdminById(id);
    done(null, admin || null);
  } catch (error) {
    done(error);
  }
});

export function requireAuth(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export default passport;
