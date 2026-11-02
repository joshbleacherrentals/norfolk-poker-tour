import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRegistrationSchema, insertNotificationSubscriberSchema, loginSchema, insertTournamentSchema, updateTournamentSchema, rulesSchema, createAdminSchema, chipStructureSchema, insertTournamentResultSchema } from "@shared/schema";
import passport, { requireAuth } from "./auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  app.get("/api/tournaments", async (_req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ message: "Failed to fetch tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ message: "Failed to fetch tournament" });
    }
  });

  app.get("/api/registrations/:tournamentId", async (req, res) => {
    try {
      const registrations = await storage.getRegistrations(req.params.tournamentId);
      // Return only names and registration types for privacy (no emails or phone numbers)
      const publicData = registrations.map(reg => ({
        name: reg.name,
        registrationType: reg.registrationType
      }));
      res.json(publicData);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get("/api/tournament-results/:tournamentId", async (req, res) => {
    try {
      const results = await storage.getTournamentResults(req.params.tournamentId);
      // Return only player names and placements for public viewing
      const publicData = results.map(result => ({
        playerName: result.playerName,
        placement: result.placement
      }));
      res.json(publicData);
    } catch (error) {
      console.error("Error fetching tournament results:", error);
      res.status(500).json({ message: "Failed to fetch tournament results" });
    }
  });

  app.post("/api/registrations", async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      
      const tournament = await storage.getTournament(validatedData.tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      // Determine registration type based on availability and user selection
      let registrationType = validatedData.registrationType || "confirmed";
      
      const seatsAvailable = tournament.maxSeats - tournament.registeredCount;
      
      // If tournament is full and user is trying to register as confirmed, put them on waitlist
      if (seatsAvailable <= 0 && registrationType === "confirmed") {
        registrationType = "waitlist";
      }
      
      // Create registration with determined type
      const registration = await storage.createRegistration({
        ...validatedData,
        registrationType
      });
      
      // Automatically add registrant to notification list
      const existingSubscribers = await storage.getNotificationSubscribers();
      const alreadySubscribed = existingSubscribers.some(
        sub => sub.email === validatedData.email
      );
      
      if (!alreadySubscribed) {
        await storage.createNotificationSubscriber({
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
        });
      }
      
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid registration data", error });
      }
      console.error("Error creating registration:", error);
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.post("/api/registrations/bulk", async (req, res) => {
    const bulkRegistrationSchema = z.object({
      name: z.string().trim().min(2, "Please enter your full name"),
      email: z.string().trim().email("Please enter a valid email address"),
      phone: z.string().trim().min(10, "Please enter a valid phone number"),
      tournamentIds: z.array(z.string().min(1)).min(1).max(50),
    });

    try {
      const parsed = bulkRegistrationSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Please check your registration details" });
      }

      const { name, phone, tournamentIds } = parsed.data;
      const email = parsed.data.email.toLowerCase();
      if (new Set(tournamentIds).size !== tournamentIds.length) {
        return res.status(400).json({ message: "Duplicate tournaments are not allowed" });
      }

      const tournaments = await Promise.all(tournamentIds.map(id => storage.getTournament(id)));
      if (tournaments.some(tournament => !tournament)) {
        return res.status(404).json({ message: "One or more tournaments could not be found" });
      }
      if (tournaments.some(tournament => new Date(tournament!.date).getTime() <= Date.now())) {
        return res.status(400).json({ message: "Only upcoming tournaments can be included" });
      }

      const result = await storage.createRegistrationsForTournaments({
        name,
        email,
        phone,
        tournamentIds,
      });

      if (result.registrations.length > 0) {
        try {
          const existingSubscribers = await storage.getNotificationSubscribers();
          const alreadySubscribed = existingSubscribers.some(
            subscriber => subscriber.email.toLowerCase() === email,
          );
          if (!alreadySubscribed) {
            await storage.createNotificationSubscriber({ name, email, phone });
          }
        } catch (error) {
          console.error("Could not add bulk registrant to notification list:", error);
        }
      }

      res.status(201).json({
        registrations: result.registrations.map(({ tournamentId, registrationType }) => ({
          tournamentId,
          registrationType,
        })),
        alreadyRegisteredTournamentIds: result.alreadyRegisteredTournamentIds,
      });
    } catch (error) {
      console.error("Error creating bulk registrations:", error);
      res.status(500).json({ message: "Failed to register for all tournaments" });
    }
  });

  app.post("/api/notification-subscribers", async (req, res) => {
    try {
      const validatedData = insertNotificationSubscriberSchema.parse(req.body);
      const subscriber = await storage.createNotificationSubscriber(validatedData);
      res.status(201).json(subscriber);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid subscriber data", error });
      }
      console.error("Error creating notification subscriber:", error);
      res.status(500).json({ message: "Failed to create notification subscriber" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
    } catch (error) {
      return res.status(400).json({ message: "Invalid login data" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ id: user.id, email: user.email, name: user.name });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      return res.json({ id: user.id, email: user.email, name: user.name });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  app.post("/api/admin/tournaments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid tournament data", error });
      }
      console.error("Error creating tournament:", error);
      res.status(500).json({ message: "Failed to create tournament" });
    }
  });

  app.put("/api/admin/tournaments/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = updateTournamentSchema.parse(req.body);
      const tournament = await storage.updateTournament(req.params.id, validatedData);
      
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      res.json(tournament);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid tournament data", error });
      }
      console.error("Error updating tournament:", error);
      res.status(500).json({ message: "Failed to update tournament" });
    }
  });

  app.delete("/api/admin/tournaments/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTournament(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Tournament not found" });
      }
      
      res.json({ message: "Tournament deleted successfully" });
    } catch (error) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ message: "Failed to delete tournament" });
    }
  });

  app.get("/api/rules", async (_req, res) => {
    try {
      const rules = await storage.getRules();
      res.json(rules || { sections: [] });
    } catch (error) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ message: "Failed to fetch rules" });
    }
  });

  app.put("/api/admin/rules", requireAuth, async (req, res) => {
    try {
      const validatedData = rulesSchema.parse(req.body);
      await storage.updateRules(validatedData);
      res.json({ message: "Rules updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid rules data", error });
      }
      console.error("Error updating rules:", error);
      res.status(500).json({ message: "Failed to update rules" });
    }
  });

  app.get("/api/chip-structure", async (_req, res) => {
    try {
      const chipStructure = await storage.getChipStructure();
      res.json(chipStructure || null);
    } catch (error) {
      console.error("Error fetching chip structure:", error);
      res.status(500).json({ message: "Failed to fetch chip structure" });
    }
  });

  app.put("/api/admin/chip-structure", requireAuth, async (req, res) => {
    try {
      const validatedData = chipStructureSchema.parse(req.body);
      await storage.updateChipStructure(validatedData);
      res.json({ message: "Chip structure updated successfully" });
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid chip structure data", error });
      }
      console.error("Error updating chip structure:", error);
      res.status(500).json({ message: "Failed to update chip structure" });
    }
  });

  app.get("/api/admin/users", requireAuth, async (_req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      const sanitizedAdmins = admins.map(({ passwordHash, ...admin }) => admin);
      res.json(sanitizedAdmins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch admin users" });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const validatedData = createAdminSchema.parse(req.body);
      
      const existingAdmin = await storage.getAdminByEmail(validatedData.email.toLowerCase());
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin with this email already exists" });
      }

      const passwordHash = await bcrypt.hash(validatedData.password, 10);
      const admin = await storage.createAdminUser({
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        passwordHash,
      });

      const { passwordHash: _, ...sanitizedAdmin } = admin;
      res.status(201).json(sanitizedAdmin);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid admin data", error });
      }
      console.error("Error creating admin:", error);
      res.status(500).json({ message: "Failed to create admin user" });
    }
  });

  app.get("/api/admin/registrations/:tournamentId", requireAuth, async (req, res) => {
    try {
      const registrations = await storage.getRegistrations(req.params.tournamentId);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.put("/api/admin/registrations/:id", requireAuth, async (req, res) => {
    try {
      const { registrationType } = req.body;
      
      if (!registrationType || !["confirmed", "waitlist", "maybe"].includes(registrationType)) {
        return res.status(400).json({ message: "Invalid registration type" });
      }
      
      const updated = await storage.updateRegistration(req.params.id, { registrationType });
      
      if (!updated) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  app.delete("/api/admin/registrations/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteRegistration(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      res.json({ message: "Registration deleted successfully" });
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ message: "Failed to delete registration" });
    }
  });

  app.get("/api/admin/notifications", requireAuth, async (_req, res) => {
    try {
      const subscribers = await storage.getNotificationSubscribers();
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching notification subscribers:", error);
      res.status(500).json({ message: "Failed to fetch notification subscribers" });
    }
  });

  app.put("/api/admin/notifications/:id", requireAuth, async (req, res) => {
    try {
      const validatedData = insertNotificationSubscriberSchema.partial().parse(req.body);
      const subscriber = await storage.updateNotificationSubscriber(req.params.id, validatedData);
      
      if (!subscriber) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.json(subscriber);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid subscriber data", error });
      }
      console.error("Error updating subscriber:", error);
      res.status(500).json({ message: "Failed to update subscriber" });
    }
  });

  app.delete("/api/admin/notifications/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNotificationSubscriber(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Subscriber not found" });
      }
      
      res.json({ message: "Subscriber deleted successfully" });
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });

  app.get("/api/admin/all-emails", requireAuth, async (_req, res) => {
    try {
      const subscribers = await storage.getNotificationSubscribers();
      const allRegistrations = await storage.getRegistrations();

      const emailMap = new Map<string, { name: string; email: string; source: string }>();

      for (const sub of subscribers) {
        const key = sub.email.toLowerCase();
        emailMap.set(key, { name: sub.name, email: sub.email, source: "subscriber" });
      }

      for (const reg of allRegistrations) {
        const key = reg.email.toLowerCase();
        if (!emailMap.has(key)) {
          emailMap.set(key, { name: reg.name, email: reg.email, source: "registration" });
        }
      }

      res.json(Array.from(emailMap.values()));
    } catch (error) {
      console.error("Error fetching all emails:", error);
      res.status(500).json({ message: "Failed to fetch all emails" });
    }
  });

  // Leaderboard (public)
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const season = typeof req.query.season === "string" ? req.query.season : "all-time";
      const seasonStartYears: Record<string, number> = {
        "2025/26": 2025,
        "2026/27": 2026,
      };
      if (season !== "all-time" && !(season in seasonStartYears)) {
        return res.status(400).json({ message: "Invalid leaderboard season" });
      }
      const seasonStartYear = seasonStartYears[season];
      const startDate = seasonStartYear === undefined
        ? undefined
        : new Date(Date.UTC(seasonStartYear, 8, 1));
      const endDate = seasonStartYear === undefined
        ? undefined
        : new Date(Date.UTC(seasonStartYear + 1, 8, 1));
      const leaderboard = await storage.getLeaderboard(limit === 0 ? 1000 : limit, startDate, endDate);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Tournament Results (admin)
  app.get("/api/admin/tournament-results/:tournamentId", requireAuth, async (req, res) => {
    try {
      const results = await storage.getTournamentResults(req.params.tournamentId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching tournament results:", error);
      res.status(500).json({ message: "Failed to fetch tournament results" });
    }
  });

  app.post("/api/admin/tournament-results", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTournamentResultSchema.parse(req.body);
      const result = await storage.createTournamentResult(validatedData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid tournament result data", error });
      }
      console.error("Error creating tournament result:", error);
      res.status(500).json({ message: "Failed to create tournament result" });
    }
  });

  app.delete("/api/admin/tournament-results/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTournamentResult(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Tournament result not found" });
      }
      
      res.json({ message: "Tournament result deleted successfully" });
    } catch (error) {
      console.error("Error deleting tournament result:", error);
      res.status(500).json({ message: "Failed to delete tournament result" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
