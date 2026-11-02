import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface TournamentFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  formatFilter: string;
  onFormatChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function TournamentFilter({
  searchTerm,
  onSearchChange,
  formatFilter,
  onFormatChange,
  sortBy,
  onSortChange,
}: TournamentFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tournaments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          data-testid="input-search"
        />
      </div>
      
      <Select value={formatFilter} onValueChange={onFormatChange}>
        <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-format">
          <SelectValue placeholder="All Formats" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Formats</SelectItem>
          <SelectItem value="Texas Hold'em">Texas Hold'em</SelectItem>
          <SelectItem value="Omaha">Omaha</SelectItem>
          <SelectItem value="Seven Card Stud">Seven Card Stud</SelectItem>
          <SelectItem value="Mixed Games">Mixed Games</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-sort">
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">Date (Earliest)</SelectItem>
          <SelectItem value="prize">Prize Pool (Highest)</SelectItem>
          <SelectItem value="seats">Seats Available</SelectItem>
          <SelectItem value="buyin">Buy-in (Lowest)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
