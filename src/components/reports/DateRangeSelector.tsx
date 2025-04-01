
import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";

interface DateRangeSelectorProps {
  dateRange: string;
  setDateRange: (range: string) => void;
  onDownload: () => void;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  dateRange, 
  setDateRange,
  onDownload
}) => {
  return (
    <div className="flex gap-2">
      <ToggleGroup type="single" value={dateRange} onValueChange={(value) => value && setDateRange(value)}>
        <ToggleGroupItem value="7" size="sm" className="text-xs h-8 px-2 gap-1">
          <Calendar className="w-3 h-3" />
          7 Hari
        </ToggleGroupItem>
        <ToggleGroupItem value="30" size="sm" className="text-xs h-8 px-2 gap-1">
          <Calendar className="w-3 h-3" />
          30 Hari
        </ToggleGroupItem>
        <ToggleGroupItem value="90" size="sm" className="text-xs h-8 px-2 gap-1">
          <Calendar className="w-3 h-3" />
          90 Hari
        </ToggleGroupItem>
      </ToggleGroup>
      <Button variant="outline" className="text-xs h-8 px-2 gap-1" onClick={onDownload}>
        <Download className="w-3 h-3" />
        Export
      </Button>
    </div>
  );
};

export default DateRangeSelector;
