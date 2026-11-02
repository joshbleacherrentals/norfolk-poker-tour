import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const tournaments = pgTable("tournaments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  format: text("format").notNull(),
  date: timestamp("date").notNull(),
  buyIn: integer("buy_in").notNull(),
  foodFee: integer("food_fee").notNull().default(0),
  registrationWindow: text("registration_window").notNull().default(""),
  prizePool: integer("prize_pool").notNull(),
  maxSeats: integer("max_seats").notNull(),
  registeredCount: integer("registered_count").notNull().default(0),
  rebuyAmount: integer("rebuy_amount").notNull(),
  rebuyChips: integer("rebuy_chips").notNull(),
  addonAmount: integer("addon_amount").notNull(),
  addonChips: integer("addon_chips").notNull(),
  startingStack: integer("starting_stack").notNull(),
  startingSmallBlind: integer("starting_small_blind").notNull(),
  startingBigBlind: integer("starting_big_blind").notNull(),
  blindLevelMinutes: integer("blind_level_minutes").notNull(),
  breakFrequency: integer("break_frequency").notNull(),
  breakDurationMinutes: integer("break_duration_minutes").notNull(),
  rebuyLimit: text("rebuy_limit").notNull(),
  rebuyDeadline: text("rebuy_deadline").notNull(),
  addonAvailable: text("addon_available").notNull(),
  lateRegistrationLevels: integer("late_registration_levels").notNull(),
  blindSchedule: text("blind_schedule").notNull(), // JSON array of blind levels
});

export const registrations = pgTable("registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  registrationType: text("registration_type").notNull().default("confirmed"), // confirmed, waitlist, maybe
});

export const notificationSubscribers = pgTable("notification_subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
});

export const tournamentRules = pgTable("tournament_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sections: text("sections").notNull(),
});

export const chipStructure = pgTable("chip_structure", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  startingStack: integer("starting_stack").notNull(),
  startingSmallBlind: integer("starting_small_blind").notNull(),
  startingBigBlind: integer("starting_big_blind").notNull(),
  blindLevelMinutes: integer("blind_level_minutes").notNull(),
  breakFrequency: integer("break_frequency").notNull(),
  breakDurationMinutes: integer("break_duration_minutes").notNull(),
  rebuyAmount: integer("rebuy_amount").notNull(),
  rebuyChips: integer("rebuy_chips").notNull(),
  rebuyLimit: text("rebuy_limit").notNull(), // e.g., "unlimited", "3", "none"
  rebuyDeadline: text("rebuy_deadline").notNull(), // e.g., "dinner break", "6 levels", "none"
  addonAmount: integer("addon_amount").notNull(),
  addonChips: integer("addon_chips").notNull(),
  addonAvailable: text("addon_available").notNull(), // e.g., "at dinner break", "none"
  lateRegistrationLevels: integer("late_registration_levels").notNull(),
  blindSchedule: text("blind_schedule").notNull(), // JSON array of blind levels
});

export const tournamentResults = pgTable("tournament_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: varchar("tournament_id").notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  playerName: text("player_name").notNull(),
  placement: integer("placement").notNull(), // 1st, 2nd, 3rd, etc.
  prizeAmount: integer("prize_amount").notNull().default(0),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
}).extend({
  date: z.coerce.date(),
  blindSchedule: z.string().refine(
    (str) => {
      try {
        const parsed = JSON.parse(str);
        return Array.isArray(parsed) && parsed.every(
          level => 
            typeof level.level === 'number' &&
            typeof level.smallBlind === 'number' &&
            typeof level.bigBlind === 'number'
        );
      } catch {
        return false;
      }
    },
    {
      message: "Blind schedule must be a valid JSON array with level, smallBlind, and bigBlind properties"
    }
  ),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  registrationType: z.enum(["confirmed", "waitlist", "maybe"]).default("confirmed"),
});

export const insertNotificationSubscriberSchema = createInsertSchema(notificationSubscribers).omit({
  id: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
});

export const updateTournamentSchema = insertTournamentSchema.partial().extend({
  date: z.coerce.date().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const rulesSchema = z.object({
  sections: z.array(z.object({
    title: z.string(),
    icon: z.string(),
    rules: z.array(z.object({
      title: z.string(),
      description: z.string(),
    })),
  })),
});

export const blindLevelSchema = z.object({
  level: z.number(),
  smallBlind: z.number(),
  bigBlind: z.number(),
  ante: z.number().optional(),
});

export const chipStructureSchema = z.object({
  startingStack: z.number().min(1),
  startingSmallBlind: z.number().min(1),
  startingBigBlind: z.number().min(1),
  blindLevelMinutes: z.number().min(1),
  breakFrequency: z.number().min(0),
  breakDurationMinutes: z.number().min(0),
  rebuyAmount: z.number().min(0),
  rebuyChips: z.number().min(0),
  rebuyLimit: z.string(),
  rebuyDeadline: z.string(),
  addonAmount: z.number().min(0),
  addonChips: z.number().min(0),
  addonAvailable: z.string(),
  lateRegistrationLevels: z.number().min(0),
  blindSchedule: z.array(blindLevelSchema),
});

export const insertTournamentResultSchema = createInsertSchema(tournamentResults).omit({
  id: true,
}).extend({
  placement: z.number().min(1, "Placement must be at least 1"),
  prizeAmount: z.number().min(0, "Prize amount cannot be negative").default(0),
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
export type UpdateTournament = z.infer<typeof updateTournamentSchema>;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertNotificationSubscriber = z.infer<typeof insertNotificationSubscriberSchema>;
export type NotificationSubscriber = typeof notificationSubscribers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type TournamentRules = typeof tournamentRules.$inferSelect;
export type RulesData = z.infer<typeof rulesSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateAdmin = z.infer<typeof createAdminSchema>;
export type ChipStructure = typeof chipStructure.$inferSelect;
export type ChipStructureData = z.infer<typeof chipStructureSchema>;
export type BlindLevel = z.infer<typeof blindLevelSchema>;
export type InsertTournamentResult = z.infer<typeof insertTournamentResultSchema>;
export type TournamentResult = typeof tournamentResults.$inferSelect;
