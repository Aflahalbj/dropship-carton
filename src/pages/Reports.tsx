
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  ArrowDown, 
  ArrowUp,
  Download,
  Calendar
} from "lucide-react";
import { 
  generateMockSalesData, 
  generateMockExpenseData, 
  generateMockProductSalesData,
  generateMockMonthlySummary,
  calculateMonthlyGrowth
} from '@/utils/mockReports';
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [salesData, setSalesData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    // Load mock data
    setSalesData(generateMockSalesData());
    setExpenseData(generateMockExpenseData());
    setProductSalesData(generateMockProductSalesData());
    setMonthlySummary(generateMockMonthlySummary());
    setGrowth(calculateMonthlyGrowth());
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getTodayDateString = () => {
    return format(new Date(), 'dd MMMM yyyy', { locale: id });
  };

  // Function to filter data based on date range
  const filterDataByDateRange = (data) => {
    if (!data || !data.length) return [];
    
    const days = parseInt(dateRange);
    const filteredData = data.slice(-days);
    return filteredData;
  };

  // Function to calculate totals from filtered data
  const calculateTotals = (data, key) => {
    if (!data || !data.length) return 0;
    return data.reduce((total, item) => total + item[key], 0);
  };

  const filteredSalesData = filterDataByDateRange(salesData);
  const filteredExpenseData = filterDataByDateRange(expenseData);

  const totalSales = calculateTotals(filteredSalesData, 'sales');
  const totalExpenses = calculateTotals(filteredExpenseData, 'amount');
  const totalProfit = totalSales - totalExpenses;

  const downloadReport = () => {
    alert('Laporan telah diunduh');
  };

  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
          <p className="text-muted-foreground">Ringkasan performa bisnis Anda untuk {getTodayDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-8 text-xs gap-1">
              <Calendar className="w-3 h-3" />
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Hari</SelectItem>
              <SelectItem value="30">30 Hari</SelectItem>
              <SelectItem value="90">90 Hari</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="text-xs h-8 px-2 gap-1" onClick={downloadReport}>
            <Download className="w-3 h-3" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.salesGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.salesGrowth > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.salesGrowth)}% dari bulan lalu
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Termasuk pembelian & biaya operasional
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalProfit)}</div>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.profitGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.profitGrowth > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.profitGrowth)}% dari bulan lalu
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSalesData.reduce((total, item) => total + item.transactions, 0)}
            </div>
            {growth && (
              <p className={`text-xs flex items-center mt-1 ${growth.transactionGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {growth.transactionGrowth > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(growth.transactionGrowth)}% dari bulan lalu
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Penjualan
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Produk
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Penjualan</CardTitle>
              <CardDescription>
                Grafik penjualan harian selama {dateRange} hari terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredSalesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const parts = date.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => new Intl.NumberFormat('id-ID', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      currency: 'IDR'
                    }).format(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Penjualan']}
                    labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#4f46e5" 
                    fill="#4f46e5" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Jumlah Transaksi</CardTitle>
                <CardDescription>
                  Jumlah transaksi harian
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredSalesData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const parts = date.split('-');
                        return `${parts[2]}/${parts[1]}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Transaksi']}
                      labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                    />
                    <Bar dataKey="transactions" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Produk Terjual</CardTitle>
                <CardDescription>
                  Jumlah produk terjual harian
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredSalesData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => {
                        const parts = date.split('-');
                        return `${parts[2]}/${parts[1]}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [value, 'Produk']}
                      labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                    />
                    <Bar dataKey="products" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tren Pengeluaran</CardTitle>
              <CardDescription>
                Grafik pengeluaran harian selama {dateRange} hari terakhir
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredExpenseData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => {
                      const parts = date.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    }}
                  />
                  <YAxis 
                    tickFormatter={(value) => new Intl.NumberFormat('id-ID', {
                      notation: 'compact',
                      compactDisplay: 'short',
                      currency: 'IDR'
                    }).format(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Pengeluaran']}
                    labelFormatter={(label) => format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pengeluaran berdasarkan Kategori</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={
                      filteredExpenseData.reduce((acc, expense) => {
                        const existingCategory = acc.find(item => item.name === expense.category);
                        if (existingCategory) {
                          existingCategory.value += expense.amount;
                        } else {
                          acc.push({ name: expense.category, value: expense.amount });
                        }
                        return acc;
                      }, [])
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {filteredExpenseData.reduce((acc, expense) => {
                      const existingCategory = acc.find(item => item.name === expense.category);
                      if (existingCategory) {
                        existingCategory.value += expense.amount;
                      } else {
                        acc.push({ name: expense.category, value: expense.amount });
                      }
                      return acc;
                    }, []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produk Teratas</CardTitle>
              <CardDescription>
                10 produk dengan penjualan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produk</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terjual</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendapatan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {productSalesData.map((product, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.revenue)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribusi Penjualan Produk</CardTitle>
              <CardDescription>
                Persentase penjualan berdasarkan kategori produk
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={monthlySummary?.topSellingCategories || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {monthlySummary?.topSellingCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Persentase']}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
