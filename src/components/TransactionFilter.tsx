
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";
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
    <div className="flex flex-1 gap-3 items-center">
      <Select value={sortField + "-" + sortDirection} onValueChange={(value) => {
        const [field, direction] = value.split("-") as [string, 'asc' | 'desc'];
        onSortChange(field, direction);
      }}>
        <Button variant="ghost" size="icon" className="w-12 h-12 rounded-lg bg-slate-50">
          <Filter className="h-4 w-4" />
        </Button>
        <SelectContent align="end">
          <SelectItem value="name-asc">Nama (A-Z)</SelectItem>
          <SelectItem value="name-desc">Nama (Z-A)</SelectItem>
          <SelectItem value="price-asc">Harga Jual (Terendah)</SelectItem>
          <SelectItem value="price-desc">Harga Jual (Tertinggi)</SelectItem>
          <SelectItem value="stock-asc">Stok (Terendah)</SelectItem>
          <SelectItem value="stock-desc">Stok (Tertinggi)</SelectItem>
          <SelectItem value="profit-asc">Keuntungan (Terendah)</SelectItem>
          <SelectItem value="profit-desc">Keuntungan (Tertinggi)</SelectItem>
        </SelectContent>
      </Select>
      
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
