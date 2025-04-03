
import React from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  
  return (
    <div className="flex flex-row gap-2">
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-28 h-8 text-xs gap-1">
          <Calendar className="w-3 h-3" />
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">7 Hari</SelectItem>
          <SelectItem value="30">30 Hari</SelectItem>
          <SelectItem value="90">90 Hari</SelectItem>
        </SelectContent>
      </Select>
      <Button 
        variant="outline" 
        className="text-xs h-8 px-2 gap-1" 
        onClick={onDownload}
      >
        <Download className="w-3 h-3" />
        Export
      </Button>
    </div>
  );
};

export default DateRangeSelector;
