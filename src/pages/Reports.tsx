
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar,
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  CartesianGrid
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Download, TrendingUp, ArrowDown, ArrowUp, DollarSign, FileText } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const Reports = () => {
  const { transactions, expenses, products } = useAppContext();
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [activeTab, setActiveTab] = useState("overview");
  
  // Filter data based on date range
  const filteredTransactions = transactions.filter(t => {
    const txDate = new Date(t.date);
    return isAfter(txDate, startOfDay(dateRange.from)) && 
           isBefore(txDate, endOfDay(dateRange.to));
  });
  
  const filteredExpenses = expenses.filter(e => {
    const expDate = new Date(e.date);
    return isAfter(expDate, startOfDay(dateRange.from)) && 
           isBefore(expDate, endOfDay(dateRange.to));
  });
  
  // Compute summary data
  const totalSales = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.total, 0);
    
  const totalPurchases = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.total, 0);
    
  const totalProfit = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.profit, 0);
    
  const totalExpenses = filteredExpenses
    .reduce((sum, e) => sum + e.amount, 0);
    
  const netIncome = totalProfit - totalExpenses;

  // Prepare data for charts
  const prepareChartData = () => {
    // Map sales transactions by date
    const salesByDate = {};
    const purchasesByDate = {};
    const profitByDate = {};
    const expensesByDate = {};
    
    filteredTransactions.forEach(t => {
      const dateStr = format(new Date(t.date), 'yyyy-MM-dd');
      
      if (t.type === 'sale') {
        salesByDate[dateStr] = (salesByDate[dateStr] || 0) + t.total;
        profitByDate[dateStr] = (profitByDate[dateStr] || 0) + t.profit;
      } else if (t.type === 'purchase') {
        purchasesByDate[dateStr] = (purchasesByDate[dateStr] || 0) + t.total;
      }
    });
    
    filteredExpenses.forEach(e => {
      const dateStr = format(new Date(e.date), 'yyyy-MM-dd');
      expensesByDate[dateStr] = (expensesByDate[dateStr] || 0) + e.amount;
    });
    
    // Create array for timeline chart
    const allDates = new Set([
      ...Object.keys(salesByDate),
      ...Object.keys(purchasesByDate),
      ...Object.keys(expensesByDate)
    ]);
    
    const timelineData = Array.from(allDates).map(date => ({
      date,
      sales: salesByDate[date] || 0,
      purchases: purchasesByDate[date] || 0,
      profit: profitByDate[date] || 0,
      expenses: expensesByDate[date] || 0
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Prepare expense categories data
    const expenseCategories = {};
    filteredExpenses.forEach(e => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
    });
    
    const expenseCategoriesData = Object.entries(expenseCategories).map(([category, amount]) => ({
      category,
      amount
    }));
    
    // Prepare product performance data
    const productSales = {};
    
    filteredTransactions
      .filter(t => t.type === 'sale')
      .forEach(t => {
        t.products.forEach(item => {
          const productId = item.product.id;
          if (!productSales[productId]) {
            productSales[productId] = {
              name: item.product.name,
              quantity: 0,
              revenue: 0,
              profit: 0
            };
          }
          
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.product.price * item.quantity;
          productSales[productId].profit += (item.product.price - item.product.supplierPrice) * item.quantity;
        });
      });
      
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);
    
    return {
      timelineData,
      expenseCategoriesData,
      topProducts
    };
  };
  
  const chartData = prepareChartData();
  
  // Define chart colors
  const COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f97316', '#06b6d4'];
  
  const downloadReport = () => {
    // In a real application, this would generate a CSV or PDF report
    alert('This would download a report in a real application');
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business Reports</h2>
          <p className="text-muted-foreground">Analyze your business performance</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon size={16} />
                <span>
                  {format(dateRange.from, "MMM d, yyyy")} - {format(dateRange.to, "MMM d, yyyy")}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      from: range.from,
                      to: range.to,
                    });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={downloadReport} variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total Sales</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-primary" />
            </div>
          </div>
          <span className="text-2xl font-bold">${totalSales.toFixed(2)}</span>
          <div className="text-xs text-green-600 mt-1 flex items-center">
            <ArrowUp size={12} className="mr-1" />
            <span>vs. previous period</span>
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total Purchases</span>
            <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
              <ArrowDown size={16} className="text-pink-500" />
            </div>
          </div>
          <span className="text-2xl font-bold">${totalPurchases.toFixed(2)}</span>
          <div className="text-xs text-red-600 mt-1 flex items-center">
            <ArrowUp size={12} className="mr-1" />
            <span>vs. previous period</span>
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Gross Profit</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <DollarSign size={16} className="text-green-500" />
            </div>
          </div>
          <span className="text-2xl font-bold">${totalProfit.toFixed(2)}</span>
          <div className="text-xs text-green-600 mt-1 flex items-center">
            <ArrowUp size={12} className="mr-1" />
            <span>vs. previous period</span>
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Net Income</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <FileText size={16} className="text-blue-500" />
            </div>
          </div>
          <span className={cn("text-2xl font-bold", netIncome < 0 ? "text-red-500" : "")}>
            ${netIncome.toFixed(2)}
          </span>
          <div className={cn("text-xs mt-1 flex items-center", netIncome < 0 ? "text-red-600" : "text-green-600")}>
            {netIncome < 0 ? (
              <ArrowDown size={12} className="mr-1" />
            ) : (
              <ArrowUp size={12} className="mr-1" />
            )}
            <span>vs. previous period</span>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Performance Timeline</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => format(parseISO(label), 'MMMM d, yyyy')}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sales" 
                    stroke="#6366f1" 
                    activeDot={{ r: 8 }} 
                    name="Sales"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#22c55e" 
                    name="Profit"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ec4899" 
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Expense Categories</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.expenseCategoriesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                      nameKey="category"
                    >
                      {chartData.expenseCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Top Performing Products</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                    <Legend />
                    <Bar dataKey="profit" fill="#22c55e" name="Profit" />
                    <Bar dataKey="revenue" fill="#6366f1" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Sales Analysis</h3>
            <p className="text-muted-foreground">Detailed sales analysis content will be shown here.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Expense Analysis</h3>
            <p className="text-muted-foreground">Detailed expense analysis content will be shown here.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Product Performance</h3>
            <p className="text-muted-foreground">Detailed product performance analysis will be shown here.</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
