
import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransactionFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  transactionType: string;
  onTransactionTypeChange: (value: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  searchTerm,
  onSearchChange,
  transactionType,
  onTransactionTypeChange,
  sortField,
  sortDirection,
  onSortChange
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Cari transaksi..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="w-full md:w-40">
        <Select 
          value={transactionType}
          onValueChange={onTransactionTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Semua Transaksi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Transaksi</SelectItem>
            <SelectItem value="sale">Penjualan</SelectItem>
            <SelectItem value="purchase">Pembelian</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-full md:w-48">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Urutkan: {getSortLabel(sortField, sortDirection)}</span>
              <ArrowUpDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onSortChange('date', 'desc')}>
              Tanggal (Terbaru)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('date', 'asc')}>
              Tanggal (Terlama)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('amount', 'desc')}>
              Jumlah (Tertinggi)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange('amount', 'asc')}>
              Jumlah (Terendah)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// Helper function to get sort label
function getSortLabel(field: string, direction: 'asc' | 'desc'): string {
  if (field === 'date') {
    return direction === 'desc' ? 'Terbaru' : 'Terlama';
  } else {
    return direction === 'desc' ? 'Tertinggi' : 'Terendah';
  }
}

export default TransactionFilter;
