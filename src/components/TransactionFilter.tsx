
import React from 'react';
import { Search, SortAsc, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface TransactionFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  transactionType: string;
  onTransactionTypeChange: (value: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  hideTransactionType?: boolean;
  timePeriod: string;
  onTimePeriodChange: (period: string) => void;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({
  searchTerm,
  onSearchChange,
  transactionType,
  onTransactionTypeChange,
  sortField,
  sortDirection,
  onSortChange,
  hideTransactionType = true,
  timePeriod,
  onTimePeriodChange
}) => {
  return <div className="flex flex-1 gap-3 items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="aspect-square w-12 h-12 rounded-lg bg-slate-50 border border-gray-300">
            <SortAsc className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem onClick={() => onSortChange('date', 'desc')}>
            Tanggal (Terbaru)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('date', 'asc')}>
            Tanggal (Terlama)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange('productName', 'asc')}>
            Nama (A-Z)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('productName', 'desc')}>
            Nama (Z-A)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onSortChange('price', 'desc')}>
            Harga (Tertinggi)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onSortChange('price', 'asc')}>
            Harga (Terendah)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          
        </DropdownMenuContent>
      </DropdownMenu>
      
      <div className="relative flex-[3]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
        <Input type="text" placeholder="Cari produk berdasarkan nama atau SKU..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10 rounded-full bg-slate-50 border border-gray-300" />
      </div>
      
      {!hideTransactionType && <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="aspect-square w-12 h-12 rounded-lg bg-slate-50 border border-gray-300">
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
        </DropdownMenu>}
    </div>;
};

export default TransactionFilter;
