import RegistrationForm from '../RegistrationForm';

export default function RegistrationFormExample() {
  return (
    <div className="p-6 max-w-lg">
      <RegistrationForm
        tournamentId="1"
        tournamentName="Friday Night Championship"
        seatsAvailable={33}
        onSubmit={(data) => console.log('Form submitted:', data)}
        onCancel={() => console.log('Form cancelled')}
      />
    </div>
  );
}
