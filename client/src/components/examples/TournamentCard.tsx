import TournamentCard from '../TournamentCard';

export default function TournamentCardExample() {
  return (
    <div className="p-6 max-w-md">
      <TournamentCard
        id="1"
        name="Friday Night Championship"
        format="Texas Hold'em"
        date={new Date(2025, 9, 10, 19, 0)}
        buyIn={250}
        foodFee={0}
        registrationWindow=""
        prizePool={10000}
        maxSeats={120}
        registeredCount={87}
        rebuyAmount={250}
        rebuyChips={500}
        addonAmount={250}
        addonChips={500}
        onRegister={(id) => console.log('Register clicked for tournament:', id)}
      />
    </div>
  );
}
