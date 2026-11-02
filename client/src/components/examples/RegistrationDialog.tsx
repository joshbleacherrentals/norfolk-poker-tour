import { useState } from 'react';
import RegistrationDialog from '../RegistrationDialog';
import { Button } from '@/components/ui/button';

export default function RegistrationDialogExample() {
  const [open, setOpen] = useState(true);

  const tournament = {
    id: '1',
    name: 'Friday Night Championship',
    format: "Texas Hold'em",
    date: new Date(2025, 9, 10, 19, 0),
    buyIn: 250,
    prizePool: 10000,
    maxSeats: 120,
    registeredCount: 87,
  };

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Show Registration Dialog</Button>
      <RegistrationDialog
        open={open}
        onClose={() => setOpen(false)}
        tournament={tournament}
        onSubmit={(data) => {
          console.log('Registration submitted:', data);
          setOpen(false);
        }}
      />
    </div>
  );
}
