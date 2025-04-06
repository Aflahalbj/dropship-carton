import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Calendar, Printer as PrinterIcon, ArrowDown, ArrowUp } from "lucide-react";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import Receipt from '../components/Receipt';
import { useNavigate } from 'react-router-dom';
import { BluetoothPrinter, printReceipt } from '@/components/BluetoothPrinter';
import { Tab } from "@headlessui/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionFilter from '@/components/TransactionFilter';
import { useReactToPrint } from 'react-to-print';

const Transactions = () => {
  const { transactions, expenses } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionType, setTransactionType] = useState('all');
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const handlePrint = useReactToPrint({
    documentTitle: 'Struk Penjualan',
    contentRef: receiptRef,
    onAfterPrint: () => {
      console.log('Print job completed');
    }
  });
  
  const handleBluetoothPrint = async () => {
    if (!selectedTransaction) return;
    
    await printReceipt(
      selectedTransaction.products,
      selectedTransaction.total,
      selectedTransaction.paymentMethod || 'cash',
      selectedTransaction.customerName,
      selectedTransaction.cashAmount,
      selectedTransaction.changeAmount,
      selectedTransaction.id || "",
      new Date(selectedTransaction.date)
    );
  };
  
  const allTransactions = [
    ...transactions.map(t => ({
      ...t,
      transactionType: t.type,
      amount: t.total
    })),
    ...expenses.map(e => ({
      id: e.id,
      date: e.date,
      amount: e.amount,
      transactionType: 'expense',
      description: e.description,
      category: e.category
    }))
  ];
  
  const filteredTransactions = allTransactions
    .filter(transaction => {
      if (transactionType !== 'all' && transaction.transactionType !== transactionType) {
        return false;
      }
      
      const searchLower = searchTerm.toLowerCase();
      
      if (transaction.transactionType === 'expense') {
        return (
          transaction.id?.toString().toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.category?.toLowerCase().includes(searchLower)
        );
      } else {
        const customerName = 'customerName' in transaction ? transaction.customerName : '';
        return (
          transaction.id?.toString().toLowerCase().includes(searchLower) ||
          (customerName && customerName.toLowerCase().includes(searchLower))
        );
      }
    })
    .sort((a, b) => {
      if (sortField === 'date') {
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return sortDirection === 'asc' 
          ? a.amount - b.amount
          : b.amount - a.amount;
      }
    });
  
  if (allTransactions.length === 0) {
    return (
      <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
            <p className="text-muted-foreground">Riwayat semua transaksi penjualan, pembelian, dan pengeluaran</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
          <Card className="p-6 flex flex-col items-center justify-center text-center py-12">
            <Info size={48} className="text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Tidak ada data transaksi</h3>
            <p className="text-muted-foreground mb-6">
              Belum ada transaksi yang tercatat
            </p>
            <Button onClick={() => navigate("/")}>Buat Transaksi Baru</Button>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
          <p className="text-muted-foreground">Riwayat semua transaksi penjualan, pembelian, dan pengeluaran</p>
        </div>
        <div className="flex items-center gap-2">
          <BluetoothPrinter />
        </div>
      </div>
      
      <Card className="p-6">
        <TransactionFilter 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          transactionType={transactionType}
          onTransactionTypeChange={setTransactionType}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={(field, direction) => {
            setSortField(field as 'date' | 'amount');
            setSortDirection(direction);
          }}
        />
        
        <Tabs defaultValue="all" value={transactionType} onValueChange={setTransactionType}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="sale">Penjualan</TabsTrigger>
            <TabsTrigger value="purchase">Pembelian</TabsTrigger>
            <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-0">
            {renderTransactionsTable(filteredTransactions)}
          </TabsContent>
          
          <TabsContent value="sale" className="space-y-0">
            {renderTransactionsTable(filteredTransactions)}
          </TabsContent>
          
          <TabsContent value="purchase" className="space-y-0">
            {renderTransactionsTable(filteredTransactions)}
          </TabsContent>
          
          <TabsContent value="expense" className="space-y-0">
            {renderTransactionsTable(filteredTransactions)}
          </TabsContent>
        </Tabs>
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {transactionType === 'all' 
                ? 'Tidak ada transaksi yang cocok dengan pencarian Anda' 
                : `Tidak ada transaksi ${getTransactionTypeLabel(transactionType)} yang cocok dengan pencarian Anda`}
            </p>
          </div>
        )}
      </Card>
      
      <div className="hidden">
        {selectedTransaction && (
          <Receipt
            ref={receiptRef}
            items={selectedTransaction.products || []}
            total={selectedTransaction.amount || 0}
            date={new Date(selectedTransaction.date)}
            transactionId={selectedTransaction.id || ""}
            paymentMethod={selectedTransaction.paymentMethod || "cash"}
            customerName={selectedTransaction.customerName || "Pelanggan"}
            cashAmount={selectedTransaction.cashAmount}
            changeAmount={selectedTransaction.changeAmount}
          />
        )}
      </div>
    </div>
  );
  
  function renderTransactionsTable(transactions: any[]) {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {transactionType === 'all' 
              ? 'Tidak ada transaksi yang cocok dengan pencarian Anda' 
              : `Tidak ada transaksi ${getTransactionTypeLabel(transactionType)} yang cocok dengan pencarian Anda`}
          </p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">ID</th>
              <th className="text-left py-3 px-4 font-medium">Tipe</th>
              <th className="text-left py-3 px-4 font-medium">Detail</th>
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
                  Jumlah
                  {sortField === 'amount' && (
                    sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                  )}
                </div>
              </th>
              <th className="text-right py-3 px-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={`${transaction.transactionType}-${transaction.id}`} className="border-b hover:bg-accent/50">
                <td className="py-3 px-4">{transaction.id?.toString().substring(0, 8)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${getTransactionTypeBadgeClasses(transaction.transactionType)}`}>
                    {getTransactionTypeLabel(transaction.transactionType)}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {transaction.transactionType === 'expense' ? (
                    <>
                      <div className="font-medium">{transaction.category}</div>
                      <div className="text-xs text-muted-foreground">{transaction.description}</div>
                    </>
                  ) : (
                    'customerName' in transaction ? transaction.customerName : "Pelanggan"
                  )}
                </td>
                <td className="py-3 px-4">
                  {format(new Date(transaction.date), 'dd MMM yyyy, HH:mm', { locale: id })}
                </td>
                <td className="py-3 px-4 font-medium">
                  Rp{transaction.amount.toLocaleString('id-ID')}
                </td>
                <td className="py-3 px-4 text-right">
                  {transaction.transactionType === 'sale' && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedTransaction(transaction)}
                          >
                            Lihat
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-auto">
                          <Receipt
                            items={transaction.products}
                            total={transaction.amount}
                            date={new Date(transaction.date)}
                            transactionId={transaction.id || ""}
                            paymentMethod={transaction.paymentMethod || "cash"}
                            customerName={transaction.customerName || "Pelanggan"}
                            cashAmount={transaction.cashAmount}
                            changeAmount={transaction.changeAmount}
                          />
                          <div className="flex justify-end gap-2 mt-4">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setTimeout(handlePrint, 100);
                              }}
                            >
                              <PrinterIcon className="w-4 h-4 mr-2" />
                              Cetak (Browser)
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                handleBluetoothPrint();
                              }}
                            >
                              <PrinterIcon className="w-4 h-4 mr-2" />
                              Cetak Thermal
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  function toggleSort(field: 'date' | 'amount') {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }
  
  function getTransactionTypeBadgeClasses(type: string) {
    switch (type) {
      case 'sale':
        return 'bg-green-100 text-green-800';
      case 'purchase':
        return 'bg-blue-100 text-blue-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
  
  function getTransactionTypeLabel(type: string) {
    switch (type) {
      case 'sale':
        return 'Penjualan';
      case 'purchase':
        return 'Pembelian';
      case 'expense':
        return 'Pengeluaran';
      default:
        return type;
    }
  }
};

export default Transactions;
