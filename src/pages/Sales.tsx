
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Calendar, Search, ArrowDown, ArrowUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Receipt from '../components/Receipt';
import { useNavigate } from 'react-router-dom';

const Sales = () => {
  const { transactions } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Filter only sale transactions
  const salesTransactions = transactions.filter(t => t.type === 'sale');
  
  const filteredTransactions = salesTransactions
    .filter(transaction => 
      // Filter by customer name or transaction ID
      transaction.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.customerName && transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortDirection === 'asc' 
          ? a.total - b.total
          : b.total - a.total;
      }
    });
  
  const toggleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  if (salesTransactions.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Penjualan</h2>
            <p className="text-muted-foreground">Rekam dan analisis transaksi penjualan</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Info size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tidak ada data penjualan</h3>
            <p className="text-muted-foreground mb-6">
              Belum ada transaksi penjualan yang tercatat
            </p>
            <Button onClick={() => navigate("/")}>Buat Penjualan Baru</Button>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Penjualan</h2>
          <p className="text-muted-foreground">Rekam dan analisis transaksi penjualan</p>
        </div>
      </div>
      
      <div className="mb-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Cari berdasarkan nama pelanggan atau ID transaksi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="w-full md:w-48">
              <Select 
                value={`${sortField}-${sortDirection}`}
                onValueChange={(value) => {
                  const [field, direction] = value.split('-');
                  setSortField(field as 'date' | 'amount');
                  setSortDirection(direction as 'asc' | 'desc');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Urutkan berdasarkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Tanggal (Terbaru)</SelectItem>
                  <SelectItem value="date-asc">Tanggal (Terlama)</SelectItem>
                  <SelectItem value="amount-desc">Jumlah (Tertinggi)</SelectItem>
                  <SelectItem value="amount-asc">Jumlah (Terendah)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">ID Transaksi</th>
                  <th className="text-left py-3 px-4 font-medium">Pelanggan</th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      Tanggal
                      {sortField === 'date' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 font-medium cursor-pointer"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center">
                      Total
                      {sortField === 'amount' && (
                        sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Pembayaran</th>
                  <th className="text-right py-3 px-4 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(transaction => (
                  <tr key={transaction.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4">{transaction.id?.toString().substring(0, 8)}</td>
                    <td className="py-3 px-4">{transaction.customerName || "Pelanggan"}</td>
                    <td className="py-3 px-4">
                      {format(new Date(transaction.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      Rp{transaction.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        transaction.paymentMethod === 'cash' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.paymentMethod === 'cash' ? 'Tunai' : 'Transfer'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">Lihat Detail</Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-auto">
                          <Receipt
                            items={transaction.products}
                            total={transaction.total}
                            date={new Date(transaction.date)}
                            transactionId={transaction.id || ""}
                            paymentMethod={transaction.paymentMethod || "cash"}
                            customerName={transaction.customerName || "Pelanggan"}
                            cashAmount={transaction.cashAmount}
                            changeAmount={transaction.changeAmount}
                          />
                        </DialogContent>
                      </Dialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada data transaksi yang cocok dengan pencarian Anda.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Sales;
