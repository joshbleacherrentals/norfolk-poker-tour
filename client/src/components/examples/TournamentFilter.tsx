import { useState } from 'react';
import TournamentFilter from '../TournamentFilter';

export default function TournamentFilterExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  return (
    <div className="p-6">
      <TournamentFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        formatFilter={formatFilter}
        onFormatChange={setFormatFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
}
