import { type Tournament } from "@shared/schema";

export function generateGoogleCalendarLink(tournament: Tournament): string {
  // Format date to Google Calendar format: YYYYMMDDTHHMMSSZ
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
  };

  const startDate = new Date(tournament.date);
  // Assume tournament lasts 4 hours (typical poker tournament duration)
  const endDate = new Date(startDate.getTime() + 4 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    text: `${tournament.name} - Norfolk Poker Tour`,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: `Join us for ${tournament.format} poker tournament!\n\n` +
      `Buy-in: $${tournament.buyIn}\n` +
      (tournament.foodFee > 0 ? `Food fee: $${tournament.foodFee}\n` : "") +
      (tournament.registrationWindow ? `Registration: ${tournament.registrationWindow}\n` : "") +
      `Prize Pool: $${tournament.prizePool}\n` +
      `Max Seats: ${tournament.maxSeats}\n\n` +
      `Visit the Norfolk Poker Tour website for more details.`,
    location: "Norfolk, VA",
  });

  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
