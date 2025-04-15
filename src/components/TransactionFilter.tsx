
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
    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
      <div className="flex flex-1 gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            type="text"
            placeholder="Cari produk berdasarkan nama atau SKU..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 rounded-full bg-muted/40"
          />
        </div>
        
        <Select value={sortField + "-" + sortDirection} onValueChange={(value) => {
          const [field, direction] = value.split("-") as [string, 'asc' | 'desc'];
          onSortChange(field, direction);
        }}>
          <SelectTrigger className="w-12 h-12 rounded-full bg-muted/40 border-0 justify-center">
            <ArrowUpDown className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="date-desc">Tanggal (Terbaru)</SelectItem>
            <SelectItem value="date-asc">Tanggal (Terlama)</SelectItem>
            <SelectItem value="amount-desc">Jumlah (Tertinggi)</SelectItem>
            <SelectItem value="amount-asc">Jumlah (Terendah)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {!hideTransactionType && (
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
      )}
    </div>
  );
};

export default TransactionFilter;
