import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { TrendingUp, Search, Calendar as CalendarIcon, ChevronRight, FileText, Package, ShoppingCart, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const Sales = () => {
  const { transactions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date>();
  
  const salesTransactions = transactions
    .filter(t => t.type === 'sale')
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  
  const filteredTransactions = salesTransactions.filter(transaction => {
    const productsMatch = transaction.products.some(item => 
      item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const dateMatch = !date || format(new Date(transaction.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    
    return (productsMatch || !searchTerm) && dateMatch;
  });
  
  const totalSales = salesTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = salesTransactions.reduce((sum, t) => sum + t.profit, 0);
  const averageOrderValue = salesTransactions.length > 0 
    ? totalSales / salesTransactions.length 
    : 0;
  
  const salesByDate = salesTransactions.reduce((acc, transaction) => {
    const dateStr = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: new Date(transaction.date),
        sales: 0,
        profit: 0,
        count: 0
      };
    }
    
    acc[dateStr].sales += transaction.total;
    acc[dateStr].profit += transaction.profit;
    acc[dateStr].count += 1;
    
    return acc;
  }, {} as Record<string, { date: Date; sales: number; profit: number; count: number }>);
  
  const salesSummary = Object.values(salesByDate)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 7);
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
          <p className="text-muted-foreground">Track and analyze your sales transactions</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total Sales</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-primary" />
            </div>
          </div>
          <span className="text-2xl font-bold">${totalSales.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            {salesTransactions.length} transactions
          </span>
        </Card>
        
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Total Profit</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-500" />
            </div>
          </div>
          <span className="text-2xl font-bold">${totalProfit.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            Profit margin: {totalSales > 0 ? Math.round((totalProfit / totalSales) * 100) : 0}%
          </span>
        </Card>
        
        <Card className="p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Average Order Value</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <ShoppingCart size={16} className="text-blue-500" />
            </div>
          </div>
          <span className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground mt-1">
            Per transaction
          </span>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <Card className="p-4 w-full md:w-1/3">
          <h3 className="text-lg font-medium mb-4">Recent Sales</h3>
          <div className="space-y-4">
            {salesSummary.map((day) => (
              <div key={day.date.toISOString()} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{format(day.date, "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{day.count} transactions</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${day.sales.toFixed(2)}</p>
                  <p className="text-xs text-green-600">${day.profit.toFixed(2)} profit</p>
                </div>
              </div>
            ))}
            
            {salesSummary.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No recent sales data</p>
            )}
          </div>
        </Card>
        
        <Card className="p-4 w-full md:w-2/3">
          <h3 className="text-lg font-medium mb-4">Sales Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Best Selling Product</div>
              <div className="font-medium">
                {getBestSellingProduct(salesTransactions)?.name || "No data"}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Most Profitable Product</div>
              <div className="font-medium">
                {getMostProfitableProduct(salesTransactions)?.name || "No data"}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Peak Sales Day</div>
              <div className="font-medium">
                {getPeakSalesDay(salesTransactions) || "No data"}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-1">Average Items Per Sale</div>
              <div className="font-medium">
                {getAverageItemsPerSale(salesTransactions).toFixed(1) || "0"}
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="all">All Sales</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
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
                  {date ? format(date, "PPP") : <span>Filter by date</span>}
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
                placeholder="Search products..."
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
        <h3 className="text-lg font-medium mb-2">No transactions found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria
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
                    Sale #{transaction.id?.slice(-6)}
                  </span>
                  <span className="bg-primary/10 text-primary text-xs rounded-full px-2 py-0.5">
                    {transaction.products.reduce((sum, item) => sum + item.quantity, 0)} items
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.date), "MMMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${transaction.total.toFixed(2)}</p>
                <p className="text-xs text-green-600">
                  ${transaction.profit.toFixed(2)} profit
                </p>
              </div>
            </div>
            
            <div className="bg-accent/40 rounded-lg p-3">
              <div className="text-sm mb-2 text-muted-foreground">Items sold:</div>
              <div className="space-y-2">
                {transaction.products.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package size={12} className="text-primary" />
                      </div>
                      <span>
                        {item.product.name} ({item.quantity} x ${item.product.price.toFixed(2)})
                      </span>
                    </div>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" className="text-xs flex items-center gap-1">
                View Details <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getBestSellingProduct(transactions: Transaction[]) {
  const productQuantities: Record<string, { name: string; quantity: number }> = {};
  
  transactions.forEach(transaction => {
    transaction.products.forEach(item => {
      const id = item.product.id;
      if (!productQuantities[id]) {
        productQuantities[id] = {
          name: item.product.name,
          quantity: 0
        };
      }
      productQuantities[id].quantity += item.quantity;
    });
  });
  
  return Object.values(productQuantities)
    .sort((a, b) => b.quantity - a.quantity)[0];
}

function getMostProfitableProduct(transactions: Transaction[]) {
  const productProfits: Record<string, { name: string; profit: number }> = {};
  
  transactions.forEach(transaction => {
    transaction.products.forEach(item => {
      const id = item.product.id;
      const profit = (item.product.price - item.product.supplierPrice) * item.quantity;
      
      if (!productProfits[id]) {
        productProfits[id] = {
          name: item.product.name,
          profit: 0
        };
      }
      productProfits[id].profit += profit;
    });
  });
  
  return Object.values(productProfits)
    .sort((a, b) => b.profit - a.profit)[0];
}

function getPeakSalesDay(transactions: Transaction[]) {
  const salesByDay: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const dayOfWeek = format(new Date(transaction.date), 'EEEE');
    salesByDay[dayOfWeek] = (salesByDay[dayOfWeek] || 0) + transaction.total;
  });
  
  const entries = Object.entries(salesByDay);
  if (entries.length === 0) return null;
  
  const [peakDay] = entries.sort((a, b) => b[1] - a[1])[0];
  return peakDay;
}

function getAverageItemsPerSale(transactions: Transaction[]) {
  if (transactions.length === 0) return 0;
  
  const totalItems = transactions.reduce((sum, transaction) => {
    return sum + transaction.products.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  
  return totalItems / transactions.length;
}

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
