import { useState } from 'react';
import SuccessModal from '../SuccessModal';
import { Button } from '@/components/ui/button';

export default function SuccessModalExample() {
  const [open, setOpen] = useState(true);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Show Success Modal</Button>
      <SuccessModal
        open={open}
        onClose={() => setOpen(false)}
        registrationId="REG-2025-001234"
        tournamentName="Friday Night Championship"
        tournamentDate={new Date(2025, 9, 10, 19, 0)}
        playerName="John Doe"
        playerEmail="john@example.com"
        playerPhone="+1 (555) 123-4567"
      />
    </div>
  );
}
