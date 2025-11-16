import { UsaStates } from "usa-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StateSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function StateSelector({
  value,
  onValueChange,
  placeholder = "Select state",
  disabled = false,
  className,
}: StateSelectorProps) {
  // Create instance of UsaStates
  const usStates = new UsaStates();
  
  // Get all US states
  const states = usStates.states.map((state: any) => ({
    value: state.abbreviation,
    label: state.name,
  }));

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className} data-testid="select-state">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {states.map((state) => (
          <SelectItem key={state.value} value={state.value}>
            {state.label} ({state.value})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}