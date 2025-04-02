
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { 
  Search, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  FileText, 
  Package, 
  X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import DateRangeSelector from '@/components/reports/DateRangeSelector';
import { toast } from 'sonner';

const Sales = () => {
  const { transactions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date>();
  const [dateRange, setDateRange] = useState('30');
  
  // Make sure dates are properly converted to Date objects
  const salesTransactions = transactions
    .filter(t => t.type === 'sale')
    .map(t => ({
      ...t,
      date: t.date instanceof Date ? t.date : new Date(t.date)
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const filteredTransactions = salesTransactions.filter(transaction => {
    const productsMatch = transaction.products.some(item => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const dateMatch = !date || format(transaction.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    return (productsMatch || !searchTerm) && dateMatch;
  });
  
  // Filter transactions based on date range
  const getFilteredTransactionsByRange = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return salesTransactions.filter(transaction => 
      transaction.date >= cutoffDate
    );
  };
  
  const rangeFilteredTransactions = getFilteredTransactionsByRange();
  
  const downloadReport = () => {
    toast.success('Laporan telah diunduh');
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Riwayat Penjualan</h2>
          <p className="text-muted-foreground">Lacak dan analisis transaksi penjualan Anda</p>
        </div>
        <DateRangeSelector 
          dateRange={dateRange} 
          setDateRange={setDateRange} 
          onDownload={downloadReport} 
        />
      </div>
      
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Transaksi Penjualan ({dateRange} Hari Terakhir)</h3>
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">
                {rangeFilteredTransactions.length} transaksi
              </span>
            </div>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">Semua Penjualan</TabsTrigger>
            <TabsTrigger value="today">Hari Ini</TabsTrigger>
            <TabsTrigger value="week">Minggu Ini</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] pl-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Filter berdasarkan tanggal</span>}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {date && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setDate(undefined)}
                className="h-9 w-9"
              >
                <X size={14} />
              </Button>
            )}
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[180px] pl-9"
              />
            </div>
          </div>
        </div>
        
        <TabsContent value="all" className="space-y-4">
          <TransactionsList transactions={filteredTransactions} />
        </TabsContent>
        
        <TabsContent value="today" className="space-y-4">
          <TransactionsList 
            transactions={filterTransactionsByToday(filteredTransactions)} 
          />
        </TabsContent>
        
        <TabsContent value="week" className="space-y-4">
          <TransactionsList 
            transactions={filterTransactionsByThisWeek(filteredTransactions)} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TransactionsList = ({ transactions }: { transactions: Transaction[] }) => {
  if (transactions.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Tidak ada transaksi ditemukan</h3>
        <p className="text-muted-foreground">
          Coba sesuaikan pencarian atau kriteria filter Anda
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="divide-y">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    Penjualan #{transaction.id?.slice(-6)}
                  </span>
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    {transaction.products.reduce((sum, item) => sum + item.quantity, 0)} item
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), "d MMMM yyyy 'pukul' HH:mm")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Rp{transaction.total.toLocaleString('id-ID')}</p>
                <p className="text-xs text-green-600">
                  Rp{transaction.profit.toLocaleString('id-ID')} profit
                </p>
              </div>
            </div>
            
            <div className="bg-accent/40 rounded-lg p-3">
              <div className="text-sm mb-2 text-muted-foreground">Item terjual:</div>
              <div className="space-y-2">
                {transaction.products.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package size={12} className="text-primary" />
                      </div>
                      <span>
                        {item.product.name} ({item.quantity} x Rp{item.product.price.toLocaleString('id-ID')})
                      </span>
                    </div>
                    <span>Rp{(item.product.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                Lihat Detail <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function filterTransactionsByToday(transactions: Transaction[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    txDate.setHours(0, 0, 0, 0);
    return txDate.getTime() === today.getTime();
  });
}

function filterTransactionsByThisWeek(transactions: Transaction[]) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  return transactions.filter(transaction => {
    const txDate = new Date(transaction.date);
    return txDate >= startOfWeek;
  });
}

import { Transaction } from '../context/AppContext';

export default Sales;
