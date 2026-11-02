import { type Tournament, type InsertTournament, type UpdateTournament, type Registration, type InsertRegistration, type NotificationSubscriber, type InsertNotificationSubscriber, type AdminUser, type InsertAdminUser, type TournamentRules, type RulesData, type ChipStructureData, type TournamentResult, type InsertTournamentResult } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { db } from "./db";
import * as schema from "@shared/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

type BulkRegistrationInput = Pick<InsertRegistration, "name" | "email" | "phone"> & {
  tournamentIds: string[];
};

export interface IStorage {
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, tournament: UpdateTournament): Promise<Tournament | undefined>;
  deleteTournament(id: string): Promise<boolean>;
  updateTournamentRegisteredCount(id: string, count: number): Promise<void>;
  
  getRegistrations(tournamentId?: string): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  createRegistrationsForTournaments(input: BulkRegistrationInput): Promise<{
    registrations: Registration[];
    alreadyRegisteredTournamentIds: string[];
  }>;
  updateRegistration(id: string, update: { registrationType: string }): Promise<Registration | undefined>;
  deleteRegistration(id: string): Promise<boolean>;
  
  getNotificationSubscribers(): Promise<NotificationSubscriber[]>;
  createNotificationSubscriber(subscriber: InsertNotificationSubscriber): Promise<NotificationSubscriber>;
  updateNotificationSubscriber(id: string, subscriber: Partial<InsertNotificationSubscriber>): Promise<NotificationSubscriber | undefined>;
  deleteNotificationSubscriber(id: string): Promise<boolean>;
  
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  getAdminById(id: string): Promise<AdminUser | undefined>;
  getAllAdmins(): Promise<AdminUser[]>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
  
  getRules(): Promise<RulesData | null>;
  updateRules(rules: RulesData): Promise<void>;
  
  getChipStructure(): Promise<ChipStructureData | null>;
  updateChipStructure(structure: ChipStructureData): Promise<void>;
  
  getTournamentResults(tournamentId?: string): Promise<TournamentResult[]>;
  createTournamentResult(result: InsertTournamentResult): Promise<TournamentResult>;
  deleteTournamentResult(id: string): Promise<boolean>;
  getLeaderboard(limit?: number, startDate?: Date, endDate?: Date): Promise<Array<{ playerName: string; totalWins: number; totalWinnings: number; tournamentsPlayed: number }>>;
}

export class MemStorage implements IStorage {
  private tournaments: Map<string, Tournament>;
  private registrations: Map<string, Registration>;
  private notificationSubscribers: Map<string, NotificationSubscriber>;
  private adminUsers: Map<string, AdminUser>;
  private rules: RulesData | null;
  private chipStructure: ChipStructureData | null;
  private tournamentResults: Map<string, TournamentResult>;

  constructor() {
    this.tournaments = new Map();
    this.registrations = new Map();
    this.notificationSubscribers = new Map();
    this.adminUsers = new Map();
    this.tournamentResults = new Map();
    this.rules = null;
    this.chipStructure = null;
    this.seedTournaments();
    this.seedRules();
    this.seedChipStructure();
    this.seedAdminUser();
  }

  private seedTournaments() {
    const defaultBlindSchedule = JSON.stringify([
      { level: 1, smallBlind: 1, bigBlind: 2 },
      { level: 2, smallBlind: 2, bigBlind: 4 },
      { level: 3, smallBlind: 3, bigBlind: 6 },
      { level: 4, smallBlind: 5, bigBlind: 10 },
      { level: 5, smallBlind: 10, bigBlind: 20 },
      { level: 6, smallBlind: 15, bigBlind: 30 },
      { level: 7, smallBlind: 25, bigBlind: 50 },
      { level: 8, smallBlind: 50, bigBlind: 100 },
      { level: 9, smallBlind: 75, bigBlind: 150 },
      { level: 10, smallBlind: 100, bigBlind: 200 },
    ]);

    const initialTournaments: InsertTournament[] = [
      {
        name: "Friday Night Championship",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 10, 19, 0),
        buyIn: 250,
        prizePool: 10000,
        maxSeats: 120,
        registeredCount: 87,
        rebuyAmount: 250,
        rebuyChips: 500,
        addonAmount: 250,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Weekend Warrior",
        format: "Omaha",
        date: new Date(2025, 9, 12, 14, 0),
        buyIn: 150,
        prizePool: 5000,
        maxSeats: 80,
        registeredCount: 45,
        rebuyAmount: 150,
        rebuyChips: 500,
        addonAmount: 150,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "High Roller Special",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 15, 20, 0),
        buyIn: 500,
        prizePool: 25000,
        maxSeats: 100,
        registeredCount: 92,
        rebuyAmount: 500,
        rebuyChips: 500,
        addonAmount: 500,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Midweek Madness",
        format: "Seven Card Stud",
        date: new Date(2025, 9, 13, 18, 30),
        buyIn: 100,
        prizePool: 3000,
        maxSeats: 60,
        registeredCount: 28,
        rebuyAmount: 100,
        rebuyChips: 500,
        addonAmount: 100,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Sunday Showdown",
        format: "Mixed Games",
        date: new Date(2025, 9, 17, 15, 0),
        buyIn: 200,
        prizePool: 8000,
        maxSeats: 90,
        registeredCount: 73,
        rebuyAmount: 200,
        rebuyChips: 500,
        addonAmount: 200,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Bounty Hunter",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 18, 19, 0),
        buyIn: 300,
        prizePool: 15000,
        maxSeats: 150,
        registeredCount: 110,
        rebuyAmount: 300,
        rebuyChips: 500,
        addonAmount: 300,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
    ];

    initialTournaments.forEach(tournament => {
      const id = randomUUID();
      this.tournaments.set(id, { 
        ...tournament,
        foodFee: tournament.foodFee ?? 0,
        registrationWindow: tournament.registrationWindow ?? "",
        id,
        registeredCount: tournament.registeredCount ?? 0
      });
    });
  }

  async getTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = randomUUID();
    const tournament: Tournament = { 
      ...insertTournament,
      foodFee: insertTournament.foodFee ?? 0,
      registrationWindow: insertTournament.registrationWindow ?? "",
      id,
      registeredCount: insertTournament.registeredCount ?? 0
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournamentRegisteredCount(id: string, count: number): Promise<void> {
    const tournament = this.tournaments.get(id);
    if (tournament) {
      tournament.registeredCount = count;
      this.tournaments.set(id, tournament);
    }
  }

  async getRegistrations(tournamentId?: string): Promise<Registration[]> {
    const registrations = Array.from(this.registrations.values());
    if (tournamentId) {
      return registrations.filter(reg => reg.tournamentId === tournamentId);
    }
    return registrations;
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = randomUUID();
    const registration: Registration = { 
      ...insertRegistration, 
      id,
      registrationType: insertRegistration.registrationType || "confirmed"
    };
    this.registrations.set(id, registration);
    
    // Only increment registered count for confirmed registrations
    if (registration.registrationType === "confirmed") {
      const tournament = this.tournaments.get(insertRegistration.tournamentId);
      if (tournament) {
        await this.updateTournamentRegisteredCount(
          insertRegistration.tournamentId,
          tournament.registeredCount + 1
        );
      }
    }
    
    return registration;
  }

  async createRegistrationsForTournaments(input: BulkRegistrationInput) {
    const registrations: Registration[] = [];
    const alreadyRegisteredTournamentIds: string[] = [];

    for (const tournamentId of input.tournamentIds) {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) throw new Error("Tournament not found");

      const existing = Array.from(this.registrations.values()).some(
        registration =>
          registration.tournamentId === tournamentId &&
          registration.email.toLowerCase() === input.email.toLowerCase(),
      );
      if (existing) {
        alreadyRegisteredTournamentIds.push(tournamentId);
        continue;
      }

      const registration = await this.createRegistration({
        tournamentId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        registrationType: tournament.registeredCount >= tournament.maxSeats ? "waitlist" : "confirmed",
      });
      registrations.push(registration);
    }

    return { registrations, alreadyRegisteredTournamentIds };
  }

  async updateRegistration(id: string, update: { registrationType: string }): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) return undefined;
    
    const oldType = registration.registrationType;
    const newType = update.registrationType;
    
    // Update the registration
    const updated: Registration = { ...registration, ...update };
    this.registrations.set(id, updated);
    
    // Update tournament confirmed count if status changed
    if (oldType !== newType) {
      const tournament = this.tournaments.get(registration.tournamentId);
      if (tournament) {
        let countChange = 0;
        if (oldType === "confirmed" && newType !== "confirmed") {
          countChange = -1; // Moving from confirmed to waitlist/maybe
        } else if (oldType !== "confirmed" && newType === "confirmed") {
          countChange = 1; // Moving to confirmed from waitlist/maybe
        }
        
        if (countChange !== 0) {
          await this.updateTournamentRegisteredCount(
            registration.tournamentId,
            tournament.registeredCount + countChange
          );
        }
      }
    }
    
    return updated;
  }

  async deleteRegistration(id: string): Promise<boolean> {
    const registration = this.registrations.get(id);
    if (!registration) return false;
    
    // If deleting a confirmed registration, decrease the tournament count
    if (registration.registrationType === "confirmed") {
      const tournament = this.tournaments.get(registration.tournamentId);
      if (tournament) {
        await this.updateTournamentRegisteredCount(
          registration.tournamentId,
          tournament.registeredCount - 1
        );
      }
    }
    
    return this.registrations.delete(id);
  }

  async getNotificationSubscribers(): Promise<NotificationSubscriber[]> {
    return Array.from(this.notificationSubscribers.values());
  }

  async createNotificationSubscriber(insertSubscriber: InsertNotificationSubscriber): Promise<NotificationSubscriber> {
    const id = randomUUID();
    const subscriber: NotificationSubscriber = { ...insertSubscriber, id };
    this.notificationSubscribers.set(id, subscriber);
    return subscriber;
  }

  async updateNotificationSubscriber(id: string, updates: Partial<InsertNotificationSubscriber>): Promise<NotificationSubscriber | undefined> {
    const subscriber = this.notificationSubscribers.get(id);
    if (!subscriber) return undefined;
    
    const updated: NotificationSubscriber = { ...subscriber, ...updates };
    this.notificationSubscribers.set(id, updated);
    return updated;
  }

  async deleteNotificationSubscriber(id: string): Promise<boolean> {
    return this.notificationSubscribers.delete(id);
  }

  async updateTournament(id: string, updates: UpdateTournament): Promise<Tournament | undefined> {
    const tournament = this.tournaments.get(id);
    if (!tournament) return undefined;
    
    const updated: Tournament = { ...tournament, ...updates };
    this.tournaments.set(id, updated);
    return updated;
  }

  async deleteTournament(id: string): Promise<boolean> {
    return this.tournaments.delete(id);
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    return Array.from(this.adminUsers.values()).find(admin => admin.email === email);
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    return this.adminUsers.get(id);
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return Array.from(this.adminUsers.values());
  }

  async createAdminUser(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const id = randomUUID();
    const admin: AdminUser = { ...insertAdmin, id };
    this.adminUsers.set(id, admin);
    return admin;
  }

  async getRules(): Promise<RulesData | null> {
    return this.rules;
  }

  async updateRules(rules: RulesData): Promise<void> {
    this.rules = rules;
  }

  private seedRules() {
    this.rules = {
      sections: [
        {
          title: "General Rules",
          icon: "Spade",
          rules: [
            {
              title: "Player Registration",
              description: "All players must register at least 15 minutes before tournament start. Late registration may be available at the director's discretion."
            },
            {
              title: "Identification",
              description: "Valid government-issued ID required for all players. Players must be 21+ to participate."
            },
            {
              title: "Tournament Director",
              description: "The Tournament Director's decisions are final. Any disputes must be raised immediately."
            }
          ]
        },
        {
          title: "Player Conduct",
          icon: "Heart",
          rules: [
            {
              title: "Etiquette",
              description: "Maintain respectful behavior at all times. Abusive language, slow play, or unsportsmanlike conduct will result in penalties."
            },
            {
              title: "Electronic Devices",
              description: "Mobile phones must be silenced. No phone calls or texting at the table during active hands."
            },
            {
              title: "Collusion",
              description: "Soft play or collusion of any kind is strictly prohibited and will result in immediate disqualification."
            }
          ]
        },
        {
          title: "Betting & Actions",
          icon: "Diamond",
          rules: [
            {
              title: "Action Order",
              description: "Players must act in turn. Out of turn actions may be binding at the dealer's discretion."
            },
            {
              title: "String Bets",
              description: "Bets must be made in one motion. Announce 'raise' before adding chips."
            },
            {
              title: "All-In",
              description: "Players may go all-in at any time for any or all of their remaining chips."
            }
          ]
        },
        {
          title: "Prize Distribution",
          icon: "Club",
          rules: [
            {
              title: "Payout Structure",
              description: "Prizes are distributed according to the posted payout structure, typically top 10-15% of field."
            },
            {
              title: "Prize Collection",
              description: "Winners must present valid ID to collect prizes. Tax forms may be required for large prizes."
            },
            {
              title: "Deals",
              description: "Final table deals are permitted with unanimous consent and floor approval."
            }
          ]
        }
      ]
    };
  }

  private async seedAdminUser() {
    const passwordHash = await bcrypt.hash("Mt123132", 10);
    const adminId = randomUUID();
    const admin: AdminUser = {
      id: adminId,
      email: "mike@bleacherrentals.com",
      passwordHash,
      name: "NPT Administrator",
    };
    this.adminUsers.set(adminId, admin);
  }

  private seedChipStructure() {
    this.chipStructure = {
      startingStack: 500,
      startingSmallBlind: 1,
      startingBigBlind: 2,
      blindLevelMinutes: 40,
      breakFrequency: 3,
      breakDurationMinutes: 15,
      rebuyAmount: 100,
      rebuyChips: 500,
      rebuyLimit: "unlimited",
      rebuyDeadline: "dinner break",
      addonAmount: 100,
      addonChips: 500,
      addonAvailable: "at dinner break",
      lateRegistrationLevels: 6,
      blindSchedule: [
        { level: 1, smallBlind: 1, bigBlind: 2 },
        { level: 2, smallBlind: 2, bigBlind: 4 },
        { level: 3, smallBlind: 3, bigBlind: 6 },
        { level: 4, smallBlind: 5, bigBlind: 10 },
        { level: 5, smallBlind: 10, bigBlind: 20 },
        { level: 6, smallBlind: 15, bigBlind: 30 },
        { level: 7, smallBlind: 25, bigBlind: 50 },
        { level: 8, smallBlind: 50, bigBlind: 100 },
        { level: 9, smallBlind: 75, bigBlind: 150 },
        { level: 10, smallBlind: 100, bigBlind: 200 },
        { level: 11, smallBlind: 150, bigBlind: 300 },
        { level: 12, smallBlind: 200, bigBlind: 400 },
        { level: 13, smallBlind: 300, bigBlind: 600 },
        { level: 14, smallBlind: 400, bigBlind: 800 },
        { level: 15, smallBlind: 500, bigBlind: 1000 },
      ]
    };
  }

  async getChipStructure(): Promise<ChipStructureData | null> {
    return this.chipStructure;
  }

  async updateChipStructure(structure: ChipStructureData): Promise<void> {
    this.chipStructure = structure;
  }

  async getTournamentResults(tournamentId?: string): Promise<TournamentResult[]> {
    const results = Array.from(this.tournamentResults.values());
    if (tournamentId) {
      return results.filter(result => result.tournamentId === tournamentId);
    }
    return results;
  }

  async createTournamentResult(insertResult: InsertTournamentResult): Promise<TournamentResult> {
    const id = randomUUID();
    const result: TournamentResult = { ...insertResult, id };
    this.tournamentResults.set(id, result);
    return result;
  }

  async deleteTournamentResult(id: string): Promise<boolean> {
    return this.tournamentResults.delete(id);
  }

  async getLeaderboard(limit: number = 10, startDate?: Date, endDate?: Date): Promise<Array<{ playerName: string; totalWins: number; totalWinnings: number; tournamentsPlayed: number }>> {
    const seasonTournamentIds = startDate && endDate
      ? new Set(Array.from(this.tournaments.values())
          .filter(tournament => tournament.date >= startDate && tournament.date < endDate)
          .map(tournament => tournament.id))
      : null;
    const results = Array.from(this.tournamentResults.values())
      .filter(result => !seasonTournamentIds || seasonTournamentIds.has(result.tournamentId));
    
    // Group by player name and calculate stats
    const playerStats = new Map<string, { totalWins: number; totalWinnings: number; tournamentsPlayed: Set<string> }>();
    
    for (const result of results) {
      const existing = playerStats.get(result.playerName) || { totalWins: 0, totalWinnings: 0, tournamentsPlayed: new Set() };
      
      if (result.placement === 1) {
        existing.totalWins += 1;
      }
      existing.totalWinnings += result.prizeAmount;
      existing.tournamentsPlayed.add(result.tournamentId);
      
      playerStats.set(result.playerName, existing);
    }
    
    // Convert to array and sort by total winnings
    const leaderboard = Array.from(playerStats.entries()).map(([playerName, stats]) => ({
      playerName,
      totalWins: stats.totalWins,
      totalWinnings: stats.totalWinnings,
      tournamentsPlayed: stats.tournamentsPlayed.size,
    })).sort((a, b) => b.totalWinnings - a.totalWinnings);
    
    return leaderboard.slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  async seedInitialData() {
    // Check if data already exists
    const tournaments = await db.select().from(schema.tournaments);
    if (tournaments.length > 0) return; // Data already seeded

    // Seed tournaments
    const defaultBlindSchedule = JSON.stringify([
      { level: 1, smallBlind: 1, bigBlind: 2 },
      { level: 2, smallBlind: 2, bigBlind: 4 },
      { level: 3, smallBlind: 3, bigBlind: 6 },
      { level: 4, smallBlind: 5, bigBlind: 10 },
      { level: 5, smallBlind: 10, bigBlind: 20 },
      { level: 6, smallBlind: 15, bigBlind: 30 },
      { level: 7, smallBlind: 25, bigBlind: 50 },
      { level: 8, smallBlind: 50, bigBlind: 100 },
      { level: 9, smallBlind: 75, bigBlind: 150 },
      { level: 10, smallBlind: 100, bigBlind: 200 },
    ]);

    const initialTournaments: InsertTournament[] = [
      {
        name: "Friday Night Championship",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 10, 19, 0),
        buyIn: 250,
        prizePool: 10000,
        maxSeats: 120,
        registeredCount: 87,
        rebuyAmount: 250,
        rebuyChips: 500,
        addonAmount: 250,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Weekend Warrior",
        format: "Omaha",
        date: new Date(2025, 9, 12, 14, 0),
        buyIn: 150,
        prizePool: 5000,
        maxSeats: 80,
        registeredCount: 45,
        rebuyAmount: 150,
        rebuyChips: 500,
        addonAmount: 150,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "High Roller Special",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 15, 20, 0),
        buyIn: 500,
        prizePool: 25000,
        maxSeats: 100,
        registeredCount: 92,
        rebuyAmount: 500,
        rebuyChips: 500,
        addonAmount: 500,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Midweek Madness",
        format: "Seven Card Stud",
        date: new Date(2025, 9, 13, 18, 30),
        buyIn: 100,
        prizePool: 3000,
        maxSeats: 60,
        registeredCount: 28,
        rebuyAmount: 100,
        rebuyChips: 500,
        addonAmount: 100,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Sunday Showdown",
        format: "Mixed Games",
        date: new Date(2025, 9, 17, 15, 0),
        buyIn: 200,
        prizePool: 8000,
        maxSeats: 90,
        registeredCount: 73,
        rebuyAmount: 200,
        rebuyChips: 500,
        addonAmount: 200,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
      {
        name: "Bounty Hunter",
        format: "Texas Hold'em",
        date: new Date(2025, 9, 18, 19, 0),
        buyIn: 300,
        prizePool: 15000,
        maxSeats: 150,
        registeredCount: 110,
        rebuyAmount: 300,
        rebuyChips: 500,
        addonAmount: 300,
        addonChips: 500,
        startingStack: 500,
        startingSmallBlind: 1,
        startingBigBlind: 2,
        blindLevelMinutes: 40,
        breakFrequency: 3,
        breakDurationMinutes: 15,
        rebuyLimit: "unlimited",
        rebuyDeadline: "dinner break",
        addonAvailable: "at dinner break",
        lateRegistrationLevels: 6,
        blindSchedule: defaultBlindSchedule,
      },
    ];

    await db.insert(schema.tournaments).values(initialTournaments);

    // Seed admin user
    const passwordHash = await bcrypt.hash("Mt123132", 10);
    await db.insert(schema.adminUsers).values({
      email: "mike@bleacherrentals.com",
      passwordHash,
      name: "NPT Administrator",
    });

    // Seed rules
    const rulesData: RulesData = {
      sections: [
        {
          title: "General Rules",
          icon: "Spade",
          rules: [
            {
              title: "Player Registration",
              description: "All players must register at least 15 minutes before tournament start. Late registration may be available at the director's discretion."
            },
            {
              title: "Identification",
              description: "Valid government-issued ID required for all players. Players must be 21+ to participate."
            },
            {
              title: "Tournament Director",
              description: "The Tournament Director's decisions are final. Any disputes must be raised immediately."
            }
          ]
        },
        {
          title: "Player Conduct",
          icon: "Heart",
          rules: [
            {
              title: "Etiquette",
              description: "Maintain respectful behavior at all times. Abusive language, slow play, or unsportsmanlike conduct will result in penalties."
            },
            {
              title: "Electronic Devices",
              description: "Mobile phones must be silenced. No phone calls or texting at the table during active hands."
            },
            {
              title: "Collusion",
              description: "Soft play or collusion of any kind is strictly prohibited and will result in immediate disqualification."
            }
          ]
        },
        {
          title: "Betting & Actions",
          icon: "Diamond",
          rules: [
            {
              title: "Action Order",
              description: "Players must act in turn. Out of turn actions may be binding at the dealer's discretion."
            },
            {
              title: "String Bets",
              description: "Bets must be made in one motion. Announce 'raise' before adding chips."
            },
            {
              title: "All-In",
              description: "Players may go all-in at any time for any or all of their remaining chips."
            }
          ]
        },
        {
          title: "Prize Distribution",
          icon: "Club",
          rules: [
            {
              title: "Payout Structure",
              description: "Prizes are distributed according to the posted payout structure, typically top 10-15% of field."
            },
            {
              title: "Prize Collection",
              description: "Winners must present valid ID to collect prizes. Tax forms may be required for large prizes."
            },
            {
              title: "Deals",
              description: "Final table deals are permitted with unanimous consent and floor approval."
            }
          ]
        }
      ]
    };

    await db.insert(schema.tournamentRules).values({
      sections: JSON.stringify(rulesData.sections),
    });

    // Seed chip structure
    const chipStructureData = {
      startingStack: 500,
      startingSmallBlind: 1,
      startingBigBlind: 2,
      blindLevelMinutes: 40,
      breakFrequency: 3,
      breakDurationMinutes: 15,
      rebuyAmount: 100,
      rebuyChips: 500,
      rebuyLimit: "unlimited",
      rebuyDeadline: "dinner break",
      addonAmount: 100,
      addonChips: 500,
      addonAvailable: "at dinner break",
      lateRegistrationLevels: 6,
      blindSchedule: defaultBlindSchedule,
    };

    await db.insert(schema.chipStructure).values(chipStructureData);
  }

  async getTournaments(): Promise<Tournament[]> {
    return await db.select().from(schema.tournaments);
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const results = await db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id));
    return results[0];
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const results = await db.insert(schema.tournaments).values(insertTournament).returning();
    return results[0];
  }

  async updateTournament(id: string, updates: UpdateTournament): Promise<Tournament | undefined> {
    const results = await db.update(schema.tournaments)
      .set(updates)
      .where(eq(schema.tournaments.id, id))
      .returning();
    return results[0];
  }

  async deleteTournament(id: string): Promise<boolean> {
    const result = await db.delete(schema.tournaments).where(eq(schema.tournaments.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateTournamentRegisteredCount(id: string, count: number): Promise<void> {
    await db.update(schema.tournaments)
      .set({ registeredCount: count })
      .where(eq(schema.tournaments.id, id));
  }

  async getRegistrations(tournamentId?: string): Promise<Registration[]> {
    if (tournamentId) {
      return await db.select().from(schema.registrations).where(eq(schema.registrations.tournamentId, tournamentId));
    }
    return await db.select().from(schema.registrations);
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const results = await db.insert(schema.registrations).values(insertRegistration).returning();
    const registration = results[0];
    
    // Only increment registered count for confirmed registrations - use atomic increment
    if (registration.registrationType === "confirmed") {
      await db.update(schema.tournaments)
        .set({ registeredCount: sql`${schema.tournaments.registeredCount} + 1` })
        .where(eq(schema.tournaments.id, insertRegistration.tournamentId));
    }
    
    return registration;
  }

  async createRegistrationsForTournaments(input: BulkRegistrationInput) {
    return await db.transaction(async tx => {
      const tournaments = await tx.select().from(schema.tournaments)
        .where(inArray(schema.tournaments.id, input.tournamentIds))
        .orderBy(schema.tournaments.id)
        .for("update");
      if (tournaments.length !== input.tournamentIds.length) {
        throw new Error("One or more tournaments could not be found");
      }

      const existing = await tx.select().from(schema.registrations)
        .where(and(
          inArray(schema.registrations.tournamentId, input.tournamentIds),
          sql`lower(${schema.registrations.email}) = ${input.email.toLowerCase()}`,
        ));
      const alreadyRegisteredTournamentIds = new Set(existing.map(registration => registration.tournamentId));
      const tournamentsById = new Map(tournaments.map(tournament => [tournament.id, tournament]));
      const registrations: Registration[] = [];

      for (const tournamentId of input.tournamentIds) {
        if (alreadyRegisteredTournamentIds.has(tournamentId)) continue;

        const tournament = tournamentsById.get(tournamentId);
        if (!tournament) throw new Error("One or more tournaments could not be found");
        const registrationType =
          tournament.registeredCount >= tournament.maxSeats ? "waitlist" : "confirmed";
        const [registration] = await tx.insert(schema.registrations).values({
          tournamentId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          registrationType,
        }).returning();
        registrations.push(registration);

        if (registrationType === "confirmed") {
          tournament.registeredCount += 1;
          await tx.update(schema.tournaments)
            .set({ registeredCount: tournament.registeredCount })
            .where(eq(schema.tournaments.id, tournamentId));
        }
      }

      return {
        registrations,
        alreadyRegisteredTournamentIds: Array.from(alreadyRegisteredTournamentIds),
      };
    });
  }

  async updateRegistration(id: string, update: { registrationType: string }): Promise<Registration | undefined> {
    // Use a transaction to ensure atomicity and prevent race conditions
    return await db.transaction(async (tx) => {
      // Get the current registration with FOR UPDATE lock to prevent concurrent modifications
      const current = await tx.select().from(schema.registrations)
        .where(eq(schema.registrations.id, id))
        .for('update');
      
      if (current.length === 0) return undefined;
      
      const oldType = current[0].registrationType;
      const newType = update.registrationType;
      const tournamentId = current[0].tournamentId;
      
      // Update the registration
      const results = await tx.update(schema.registrations)
        .set(update)
        .where(eq(schema.registrations.id, id))
        .returning();
      
      if (results.length === 0) return undefined;
      const updated = results[0];
      
      // Atomically update tournament confirmed count if status changed
      if (oldType !== newType) {
        if (oldType === "confirmed" && newType !== "confirmed") {
          // Moving from confirmed to waitlist/maybe: decrement count
          await tx.update(schema.tournaments)
            .set({ registeredCount: sql`${schema.tournaments.registeredCount} - 1` })
            .where(eq(schema.tournaments.id, tournamentId));
        } else if (oldType !== "confirmed" && newType === "confirmed") {
          // Moving to confirmed from waitlist/maybe: increment count
          await tx.update(schema.tournaments)
            .set({ registeredCount: sql`${schema.tournaments.registeredCount} + 1` })
            .where(eq(schema.tournaments.id, tournamentId));
        }
      }
      
      return updated;
    });
  }

  async deleteRegistration(id: string): Promise<boolean> {
    // Use a transaction to ensure atomicity and prevent race conditions
    return await db.transaction(async (tx) => {
      // Get the current registration with FOR UPDATE lock
      const current = await tx.select().from(schema.registrations)
        .where(eq(schema.registrations.id, id))
        .for('update');
      
      if (current.length === 0) return false;
      
      const registration = current[0];
      
      // Delete the registration
      const result = await tx.delete(schema.registrations)
        .where(eq(schema.registrations.id, id));
      
      // If deleting a confirmed registration, decrease the tournament count atomically
      if (registration.registrationType === "confirmed") {
        await tx.update(schema.tournaments)
          .set({ registeredCount: sql`${schema.tournaments.registeredCount} - 1` })
          .where(eq(schema.tournaments.id, registration.tournamentId));
      }
      
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  async getNotificationSubscribers(): Promise<NotificationSubscriber[]> {
    return await db.select().from(schema.notificationSubscribers);
  }

  async createNotificationSubscriber(insertSubscriber: InsertNotificationSubscriber): Promise<NotificationSubscriber> {
    const results = await db.insert(schema.notificationSubscribers).values(insertSubscriber).returning();
    return results[0];
  }

  async updateNotificationSubscriber(id: string, updates: Partial<InsertNotificationSubscriber>): Promise<NotificationSubscriber | undefined> {
    const results = await db.update(schema.notificationSubscribers)
      .set(updates)
      .where(eq(schema.notificationSubscribers.id, id))
      .returning();
    return results[0];
  }

  async deleteNotificationSubscriber(id: string): Promise<boolean> {
    const result = await db.delete(schema.notificationSubscribers).where(eq(schema.notificationSubscribers.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const results = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email));
    return results[0];
  }

  async getAdminById(id: string): Promise<AdminUser | undefined> {
    const results = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id));
    return results[0];
  }

  async getAllAdmins(): Promise<AdminUser[]> {
    return await db.select().from(schema.adminUsers);
  }

  async createAdminUser(insertAdmin: InsertAdminUser): Promise<AdminUser> {
    const results = await db.insert(schema.adminUsers).values(insertAdmin).returning();
    return results[0];
  }

  async getRules(): Promise<RulesData | null> {
    const results = await db.select().from(schema.tournamentRules);
    if (results.length === 0) return null;
    
    const parsed = JSON.parse(results[0].sections);
    return { sections: parsed };
  }

  async updateRules(rules: RulesData): Promise<void> {
    const existing = await db.select().from(schema.tournamentRules);
    const sections = JSON.stringify(rules.sections);
    
    if (existing.length > 0) {
      await db.update(schema.tournamentRules)
        .set({ sections })
        .where(eq(schema.tournamentRules.id, existing[0].id));
    } else {
      await db.insert(schema.tournamentRules).values({ sections });
    }
  }

  async getChipStructure(): Promise<ChipStructureData | null> {
    const results = await db.select().from(schema.chipStructure);
    if (results.length === 0) return null;
    
    const row = results[0];
    return {
      startingStack: row.startingStack,
      startingSmallBlind: row.startingSmallBlind,
      startingBigBlind: row.startingBigBlind,
      blindLevelMinutes: row.blindLevelMinutes,
      breakFrequency: row.breakFrequency,
      breakDurationMinutes: row.breakDurationMinutes,
      rebuyAmount: row.rebuyAmount,
      rebuyChips: row.rebuyChips,
      rebuyLimit: row.rebuyLimit,
      rebuyDeadline: row.rebuyDeadline,
      addonAmount: row.addonAmount,
      addonChips: row.addonChips,
      addonAvailable: row.addonAvailable,
      lateRegistrationLevels: row.lateRegistrationLevels,
      blindSchedule: JSON.parse(row.blindSchedule),
    };
  }

  async updateChipStructure(structure: ChipStructureData): Promise<void> {
    const existing = await db.select().from(schema.chipStructure);
    const blindSchedule = JSON.stringify(structure.blindSchedule);
    
    const updateData = {
      startingStack: structure.startingStack,
      startingSmallBlind: structure.startingSmallBlind,
      startingBigBlind: structure.startingBigBlind,
      blindLevelMinutes: structure.blindLevelMinutes,
      breakFrequency: structure.breakFrequency,
      breakDurationMinutes: structure.breakDurationMinutes,
      rebuyAmount: structure.rebuyAmount,
      rebuyChips: structure.rebuyChips,
      rebuyLimit: structure.rebuyLimit,
      rebuyDeadline: structure.rebuyDeadline,
      addonAmount: structure.addonAmount,
      addonChips: structure.addonChips,
      addonAvailable: structure.addonAvailable,
      lateRegistrationLevels: structure.lateRegistrationLevels,
      blindSchedule,
    };
    
    if (existing.length > 0) {
      await db.update(schema.chipStructure)
        .set(updateData)
        .where(eq(schema.chipStructure.id, existing[0].id));
    } else {
      await db.insert(schema.chipStructure).values(updateData);
    }
  }

  async getTournamentResults(tournamentId?: string): Promise<TournamentResult[]> {
    if (tournamentId) {
      return await db.select().from(schema.tournamentResults).where(eq(schema.tournamentResults.tournamentId, tournamentId));
    }
    return await db.select().from(schema.tournamentResults);
  }

  async createTournamentResult(insertResult: InsertTournamentResult): Promise<TournamentResult> {
    const results = await db.insert(schema.tournamentResults).values(insertResult).returning();
    return results[0];
  }

  async deleteTournamentResult(id: string): Promise<boolean> {
    const result = await db.delete(schema.tournamentResults).where(eq(schema.tournamentResults.id, id)).returning();
    return result.length > 0;
  }

  async getLeaderboard(limit: number = 10, startDate?: Date, endDate?: Date): Promise<Array<{ playerName: string; totalWins: number; totalWinnings: number; tournamentsPlayed: number }>> {
    let results = await db.select().from(schema.tournamentResults);
    if (startDate && endDate) {
      const tournaments = await db.select({
        id: schema.tournaments.id,
        date: schema.tournaments.date,
      }).from(schema.tournaments);
      const seasonTournamentIds = new Set(
        tournaments
          .filter(tournament => tournament.date >= startDate && tournament.date < endDate)
          .map(tournament => tournament.id),
      );
      results = results.filter(result => seasonTournamentIds.has(result.tournamentId));
    }
    
    // Group by player name and calculate stats
    const playerStats = new Map<string, { totalWins: number; totalWinnings: number; tournamentsPlayed: Set<string> }>();
    
    for (const result of results) {
      const existing = playerStats.get(result.playerName) || { totalWins: 0, totalWinnings: 0, tournamentsPlayed: new Set() };
      
      if (result.placement === 1) {
        existing.totalWins += 1;
      }
      existing.totalWinnings += result.prizeAmount;
      existing.tournamentsPlayed.add(result.tournamentId);
      
      playerStats.set(result.playerName, existing);
    }
    
    // Convert to array and sort by total winnings
    const leaderboard = Array.from(playerStats.entries()).map(([playerName, stats]) => ({
      playerName,
      totalWins: stats.totalWins,
      totalWinnings: stats.totalWinnings,
      tournamentsPlayed: stats.tournamentsPlayed.size,
    })).sort((a, b) => b.totalWinnings - a.totalWinnings);
    
    return leaderboard.slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
