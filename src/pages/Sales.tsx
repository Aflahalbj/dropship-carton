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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { toast } from 'sonner';
import { 
  generateMockSalesData, 
  generateMockExpenseData, 
  generateMockProductSalesData,
  generateMockMonthlySummary,
  calculateMonthlyGrowth
} from '@/utils/mockReports';

const Sales = () => {
  const { transactions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date>();
  const [dateRange, setDateRange] = useState('30');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [productSalesData, setProductSalesData] = useState<any[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<any>(null);
  const [growth, setGrowth] = useState<any>(null);
  
  useEffect(() => {
    setSalesData(generateMockSalesData());
    setExpenseData(generateMockExpenseData());
    setProductSalesData(generateMockProductSalesData());
    setMonthlySummary(generateMockMonthlySummary());
    setGrowth(calculateMonthlyGrowth());
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTodayDateString = () => {
    return format(new Date(), 'dd MMMM yyyy', { locale: id });
  };
  
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
  
  const getFilteredTransactionsByRange = () => {
    const days = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return salesTransactions.filter(transaction => 
      transaction.date >= cutoffDate
    );
  };
  
  const rangeFilteredTransactions = getFilteredTransactionsByRange();
  
  const filterDataByDateRange = (data: any[]) => {
    if (!data || !data.length) return [];
    
    const days = parseInt(dateRange);
    const filteredData = data.slice(-days);
    return filteredData;
  };

  const calculateTotals = (data: any[], key: string) => {
    if (!data || !data.length) return 0;
    return data.reduce((total, item) => total + item[key], 0);
  };

  const filteredSalesData = filterDataByDateRange(salesData);
  const filteredExpenseData = filterDataByDateRange(expenseData);

  const totalSales = calculateTotals(filteredSalesData, 'sales');
  const totalExpenses = calculateTotals(filteredExpenseData, 'amount');
  const totalProfit = totalSales - totalExpenses;
  
  const downloadReport = () => {
    toast.success('Laporan telah diunduh');
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Riwayat Penjualan</h2>
          <p className="text-muted-foreground">Lacak dan analisis transaksi penjualan Anda untuk {getTodayDateString()}</p>
        </div>
        <DateRangeSelector 
          dateRange={dateRange} 
          setDateRange={setDateRange} 
          onDownload={downloadReport} 
        />
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card className="p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Penjualan</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalSales)}</p>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.salesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.salesGrowth > 0 ? <span className="mr-1">↑</span> : <span className="mr-1">↓</span>}
                {Math.abs(growth.salesGrowth)}% dari bulan lalu
              </p>
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Termasuk pembelian & biaya operasional
            </p>
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Profit Bersih</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalProfit)}</p>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.profitGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.profitGrowth > 0 ? <span className="mr-1">↑</span> : <span className="mr-1">↓</span>}
                {Math.abs(growth.profitGrowth)}% dari bulan lalu
              </p>
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
            <p className="text-2xl font-bold mt-1">
              {filteredSalesData.reduce((total, item) => total + item.transactions, 0)}
            </p>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.transactionGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.transactionGrowth > 0 ? <span className="mr-1">↑</span> : <span className="mr-1">↓</span>}
                {Math.abs(growth.transactionGrowth)}% dari bulan lalu
              </p>
            )}
          </div>
        </Card>
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
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2 py-1">Semua Penjualan</TabsTrigger>
            <TabsTrigger value="today" className="text-xs px-2 py-1">Hari Ini</TabsTrigger>
            <TabsTrigger value="week" className="text-xs px-2 py-1">Minggu Ini</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "h-8 text-xs px-2 w-[200px] sm:w-[240px] pl-3 text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  {date ? format(date, "PPP") : <span>Filter berdasarkan tanggal</span>}
                  <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
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
                className="h-8 w-8"
              >
                <X size={12} />
              </Button>
            )}
            
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={12} />
              <Input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[160px] sm:w-[180px] h-8 pl-7 pr-2 text-xs"
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
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Analisis Produk</h3>
        <Card>
          <ScrollArea className="h-[350px]" orientation="both">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Produk</TableHead>
                  <TableHead>Terjual</TableHead>
                  <TableHead>Pendapatan</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productSalesData.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    <TableCell>{formatCurrency(product.profit)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>
      
      {monthlySummary && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Distribusi Kategori</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            {monthlySummary.topSellingCategories.map((category: any, index: number) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm font-semibold">{category.percentage}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${category.percentage}%` }}
                  ></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
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
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2 py-1 flex items-center gap-1">
                Lihat Detail <ChevronRight size={12} />
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
