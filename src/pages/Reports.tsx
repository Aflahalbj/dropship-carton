
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, LineChart, PieChart, Calendar, Download, Filter } from 'lucide-react';
import { 
  Chart as ChartComponent, 
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';

// Register ChartJS components
ChartComponent.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Generate dates for the past week
const generatePastWeekDates = () => {
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'dd MMM'));
  }
  return dates;
};

// Generate random data for sales
const generateRandomData = (min: number, max: number, count: number) => {
  return Array.from({ length: count }, () => 
    Math.floor(Math.random() * (max - min + 1) + min)
  );
};

// Generate fake transaction data for the past week
const generateFakeTransactions = () => {
  const dates = [];
  const transactions = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const dailyTransCount = Math.floor(Math.random() * 5) + 1; // 1-5 transactions per day
    
    for (let j = 0; j < dailyTransCount; j++) {
      const transactionAmount = Math.floor(Math.random() * 500000) + 50000; // 50k-550k transaction
      const profit = Math.floor(transactionAmount * 0.2); // 20% profit margin
      const type = Math.random() > 0.7 ? 'purchase' : 'sale'; // 70% sales, 30% purchases
      
      transactions.push({
        id: `trans-${formattedDate}-${j}`,
        date: format(date, 'dd MMM yyyy, HH:mm'),
        fullDate: date,
        type,
        total: transactionAmount,
        profit: type === 'sale' ? profit : 0,
        products: Math.floor(Math.random() * 3) + 1 // 1-3 products per transaction
      });
    }
    
    dates.push(formattedDate);
  }
  
  return { dates, transactions };
};

const { dates: pastWeekDates, transactions: fakeTransactions } = generateFakeTransactions();

const Reports = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [reportPeriod, setReportPeriod] = useState('week');
  
  const pastWeekLabels = generatePastWeekDates();
  
  // Calculate daily sales and profits from transactions
  const dailySales = pastWeekLabels.map(date => {
    const dayTransactions = fakeTransactions.filter(
      t => t.date.includes(date) && t.type === 'sale'
    );
    return dayTransactions.reduce((sum, t) => sum + t.total, 0);
  });
  
  const dailyProfits = pastWeekLabels.map(date => {
    const dayTransactions = fakeTransactions.filter(
      t => t.date.includes(date) && t.type === 'sale'
    );
    return dayTransactions.reduce((sum, t) => sum + t.profit, 0);
  });
  
  const dailyPurchases = pastWeekLabels.map(date => {
    const dayTransactions = fakeTransactions.filter(
      t => t.date.includes(date) && t.type === 'purchase'
    );
    return dayTransactions.reduce((sum, t) => sum + t.total, 0);
  });
  
  // Prepare chart data
  const salesData = {
    labels: pastWeekLabels,
    datasets: [
      {
        label: 'Penjualan',
        data: dailySales,
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const salesVsPurchasesData = {
    labels: pastWeekLabels,
    datasets: [
      {
        label: 'Penjualan',
        data: dailySales,
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pembelian',
        data: dailyPurchases,
        backgroundColor: 'rgba(220, 38, 38, 0.5)',
        borderColor: 'rgba(220, 38, 38, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const profitData = {
    labels: pastWeekLabels,
    datasets: [
      {
        label: 'Keuntungan',
        data: dailyProfits,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        fill: true,
      },
    ],
  };
  
  // Calculate totals
  const totalSales = dailySales.reduce((sum, value) => sum + value, 0);
  const totalPurchases = dailyPurchases.reduce((sum, value) => sum + value, 0);
  const totalProfit = dailyProfits.reduce((sum, value) => sum + value, 0);
  const totalTransactions = fakeTransactions.length;
  
  // Product category distribution for pie chart
  const pieData = {
    labels: ['Elektronik', 'Pakaian', 'Makanan', 'Minuman', 'Aksesoris'],
    datasets: [
      {
        data: [25, 30, 15, 10, 20],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Laporan</h2>
          <p className="text-muted-foreground">Lihat analisis bisnis Anda</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar size={16} />
            <span>7 hari terakhir</span>
          </Button>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-muted-foreground text-sm mb-1">Total Penjualan</h3>
          <p className="text-2xl font-bold">Rp{totalSales.toLocaleString('id-ID')}</p>
          <p className="text-xs text-green-500 mt-1">+12.5% minggu ini</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-muted-foreground text-sm mb-1">Total Pembelian</h3>
          <p className="text-2xl font-bold">Rp{totalPurchases.toLocaleString('id-ID')}</p>
          <p className="text-xs text-red-500 mt-1">+8.3% minggu ini</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-muted-foreground text-sm mb-1">Keuntungan</h3>
          <p className="text-2xl font-bold">Rp{totalProfit.toLocaleString('id-ID')}</p>
          <p className="text-xs text-green-500 mt-1">+15.2% minggu ini</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-muted-foreground text-sm mb-1">Transaksi</h3>
          <p className="text-2xl font-bold">{totalTransactions}</p>
          <p className="text-xs text-green-500 mt-1">+5.7% minggu ini</p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="font-medium mb-4">Penjualan Harian</h3>
          <div className="h-64">
            <Bar 
              data={salesData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'Rp' + Number(value).toLocaleString('id-ID');
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium mb-4">Keuntungan Harian</h3>
          <div className="h-64">
            <Line 
              data={profitData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'Rp' + Number(value).toLocaleString('id-ID');
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <h3 className="font-medium mb-4">Penjualan vs Pembelian</h3>
          <div className="h-64">
            <Bar 
              data={salesVsPurchasesData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'Rp' + Number(value).toLocaleString('id-ID');
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-medium mb-4">Distribusi Kategori Produk</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-3/4 h-full">
              <Pie 
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right' as const,
                    },
                  },
                }}
              />
            </div>
          </div>
        </Card>
      </div>
      
      <Card>
        <div className="p-4 border-b">
          <h3 className="font-medium">Transaksi Terbaru</h3>
        </div>
        <div className="divide-y">
          {fakeTransactions.slice(0, 10).map((transaction) => (
            <div key={transaction.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{transaction.type === 'sale' ? 'Penjualan' : 'Pembelian'}</p>
                <p className="text-sm text-muted-foreground">{transaction.date}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'sale' ? '+' : '-'}Rp{transaction.total.toLocaleString('id-ID')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.products} produk
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Reports;
