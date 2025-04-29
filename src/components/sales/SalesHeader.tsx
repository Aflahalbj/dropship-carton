import React from 'react';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
interface SalesHeaderProps {
  title: string;
  description: string;
  transactionType: string;
  onTransactionTypeChange: (type: string) => void;
}
const SalesHeader: React.FC<SalesHeaderProps> = ({
  title,
  description,
  transactionType,
  onTransactionTypeChange
}) => {
  return <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <BluetoothPrinter className="w-auto" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="aspect-square w-12 h-12 rounded-lg bg-slate-50 border border-gray-300">
              <Calendar className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onTransactionTypeChange('all')}>Semua Transaksi</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('today')}>
              Hari Ini
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('week')}>1 Minggu Terakhir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('month')}>1 Bulan Terakhir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('year')}>1 Tahun Terakhir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>;
};
export default SalesHeader;