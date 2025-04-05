import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, ArrowUp, ArrowDown, TrendingUp, Calendar, BarChart3, PieChart, DollarSign } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isSameDay, isWithinInterval } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title);

type DateRangeType = '7days' | '30days' | 'thisMonth' | 'all';

const Reports = () => {
  const { transactions } = useAppContext();
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<DateRangeType>('30days');
  const [chartType, setChartType] = useState<'sales' | 'profit'>('sales');
  
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    
    let startDate: Date;
    let endDate = today;
    
    switch (dateRange) {
      case '7days':
        startDate = subDays(today, 7);
        break;
      case '30days':
        startDate = subDays(today, 30);
        break;
      case 'thisMonth':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'all':
      default:
        return transactions;
    }
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: startDate, end: endDate });
    });
  }, [transactions, dateRange]);
  
  const salesTransactions = filteredTransactions.filter(t => t.type === 'sale');
  const purchaseTransactions = filteredTransactions.filter(t => t.type === 'purchase');
  
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = salesTransactions.reduce((sum, t) => sum + t.profit, 0);
  
  const formatCurrency = (amount: number) => `Rp${amount.toLocaleString('id-ID')}`;
  
  if (transactions.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
            <p className="text-muted-foreground">Analisis performa bisnis Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Info size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tidak ada data laporan</h3>
            <p className="text-muted-foreground mb-6">
              Belum ada data transaksi yang tersedia untuk dianalisis
            </p>
            <Button onClick={() => navigate("/")}>Buat Transaksi Baru</Button>
          </Card>
        </div>
      </div>
    );
  }
  
  const salesByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    
    salesTransactions.forEach(transaction => {
      transaction.products.forEach(item => {
        const category = 'Produk';
        const amount = (item.product.price * item.quantity);
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
    });
    
    return {
      labels: Array.from(categoryMap.keys()),
      values: Array.from(categoryMap.values()),
    };
  }, [salesTransactions]);
  
  const salesOverTime = useMemo(() => {
    const dateMap = new Map<string, number>();
    const profitMap = new Map<string, number>();
    
    salesTransactions.forEach(transaction => {
      const dateStr = format(new Date(transaction.date), 'yyyy-MM-dd');
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + transaction.total);
      profitMap.set(dateStr, (profitMap.get(dateStr) || 0) + transaction.profit);
    });
    
    const sortedDates = Array.from(dateMap.keys()).sort();
    
    return {
      labels: sortedDates.map(date => format(new Date(date), 'dd/MM/yy')),
      salesData: sortedDates.map(date => dateMap.get(date) || 0),
      profitData: sortedDates.map(date => profitMap.get(date) || 0),
    };
  }, [salesTransactions]);
  
  const pieChartData = {
    labels: salesByCategory.labels,
    datasets: [
      {
        data: salesByCategory.values,
        backgroundColor: [
          '#4C51BF', '#4299E1', '#38B2AC', '#48BB78', '#F6E05E',
          '#ED8936', '#ED64A6', '#9F7AEA', '#667EEA',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const lineChartData = {
    labels: salesOverTime.labels,
    datasets: [
      {
        label: chartType === 'sales' ? 'Penjualan' : 'Profit',
        data: chartType === 'sales' ? salesOverTime.salesData : salesOverTime.profitData,
        borderColor: chartType === 'sales' ? '#4C51BF' : '#48BB78',
        backgroundColor: chartType === 'sales' ? 'rgba(76, 81, 191, 0.2)' : 'rgba(72, 187, 120, 0.2)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
          <p className="text-muted-foreground">Analisis performa bisnis Anda</p>
        </div>
        
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as DateRangeType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">7 Hari Terakhir</SelectItem>
            <SelectItem value="30days">30 Hari Terakhir</SelectItem>
            <SelectItem value="thisMonth">Bulan Ini</SelectItem>
            <SelectItem value="all">Semua Waktu</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Penjualan</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalSales)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{salesTransactions.length} transaksi</p>
            </div>
            <div className="bg-primary/10 p-3 rounded-full">
              <TrendingUp size={24} className="text-primary" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Pembelian</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalPurchases)}</h3>
              <p className="text-xs text-muted-foreground mt-1">{purchaseTransactions.length} transaksi</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <DollarSign size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Profit</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalProfit)}</h3>
              <p className="text-xs text-muted-foreground mt-1">Margin: {totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <BarChart3 size={24} className="text-green-600" />
            </div>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-1">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <PieChart size={18} className="mr-2 text-muted-foreground" />
            Penjualan berdasarkan Kategori
          </h3>
          <div className="h-[300px] flex items-center justify-center">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </Card>
        
        <Card className="p-6 col-span-1 lg:col-span-2">
          <div className="flex justify-between mb-4 items-center">
            <h3 className="text-lg font-medium flex items-center">
              <BarChart3 size={18} className="mr-2 text-muted-foreground" />
              Perkembangan {chartType === 'sales' ? 'Penjualan' : 'Profit'} 
            </h3>
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'sales' | 'profit')} className="w-48">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sales">Penjualan</TabsTrigger>
                <TabsTrigger value="profit">Profit</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="h-[300px]">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </Card>
      </div>
      
      <Card className="p-6 mt-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <Calendar size={18} className="mr-2 text-muted-foreground" />
          Transaksi Terkini
        </h3>
        
        {salesTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Pelanggan</th>
                  <th className="text-left py-3 px-4 font-medium">Total</th>
                  <th className="text-left py-3 px-4 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {salesTransactions.slice(0, 5).map(transaction => (
                  <tr key={transaction.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">{transaction.id?.toString().substring(0, 8)}</td>
                    <td className="py-3 px-4">
                      {format(new Date(transaction.date), 'dd MMM yyyy')}
                    </td>
                    <td className="py-3 px-4">{transaction.customerName || "Pelanggan"}</td>
                    <td className="py-3 px-4">
                      {formatCurrency(transaction.total)}
                    </td>
                    <td className="py-3 px-4 text-green-600">
                      {formatCurrency(transaction.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">Tidak ada transaksi penjualan terbaru</p>
        )}
        
        <div className="text-center mt-4">
          <Button variant="outline" onClick={() => navigate("/sales")}>
            Lihat Semua Transaksi
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Reports;
