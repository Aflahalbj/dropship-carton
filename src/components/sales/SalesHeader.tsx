
import React from 'react';
import { BluetoothPrinter } from '@/components/BluetoothPrinter';
import { Button } from '@/components/ui/button';
import { Printer, Filter } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="rounded-lg bg-slate-50 border border-gray-300 gap-2"
            >
              <Filter className="h-4 w-4" />
              {transactionType === 'all' ? 'Semua Transaksi' : 
               transactionType === 'sale' ? 'Penjualan' : 'Pembelian'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white">
            <DropdownMenuItem onClick={() => onTransactionTypeChange('all')}>
              Semua Transaksi
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('sale')}>
              Penjualan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onTransactionTypeChange('purchase')}>
              Pembelian
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon">
          <Printer className="h-4 w-4" />
        </Button>
        <BluetoothPrinter />
      </div>
    </div>
  );
};

export default SalesHeader;
