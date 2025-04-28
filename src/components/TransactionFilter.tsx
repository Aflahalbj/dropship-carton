
import React from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TransactionFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  transactionType: string;
  onTransactionTypeChange: (value: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  hideTransactionType?: boolean;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  searchTerm,
  onSearchChange,
  transactionType,
  onTransactionTypeChange,
  sortField,
  sortDirection,
  onSortChange,
  hideTransactionType = false
}) => {
  return (
    <div className="flex flex-1 gap-3 items-center">
      <Button 
        variant="ghost" 
        size="icon" 
        className="w-12 h-12 rounded-lg bg-slate-50"
        onClick={() => {
          // Toggle sort direction or change sort field
          if (sortField === 'date') {
            onSortChange('date', sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            onSortChange('date', 'desc');
          }
        }}
      >
        <ArrowUpDown className="h-4 w-4" />
      </Button>
      
      <div className="relative flex-[3]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          type="text"
          placeholder="Cari produk berdasarkan nama atau SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 rounded-full bg-slate-50 border-0"
        />
      </div>
      
      {!hideTransactionType && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="rounded-lg bg-slate-50 w-12 h-12 p-0 flex items-center justify-center"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      )}
    </div>
  );
};

export default TransactionFilter;
