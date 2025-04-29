import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Calendar, Printer as PrinterIcon } from "lucide-react";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Receipt from '../components/Receipt';
import { useNavigate } from 'react-router-dom';
import { BluetoothPrinter, printReceipt } from '@/components/BluetoothPrinter';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import TransactionFilter from '@/components/TransactionFilter';
import { useReactToPrint } from 'react-to-print';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
const Transactions = () => {
  const {
    transactions,
    expenses
  } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'name' | 'price' | 'stock'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionType, setTransactionType] = useState('all');
  const receiptRef = useRef<HTMLDivElement>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handlePrint = useReactToPrint({
    documentTitle: 'Struk Penjualan',
    contentRef: receiptRef,
    onAfterPrint: () => {
      console.log('Print job completed');
    }
  });
  const handleBluetoothPrint = async () => {
    if (!selectedTransaction) return;
    await printReceipt(selectedTransaction.products, selectedTransaction.total, selectedTransaction.paymentMethod || 'cash', selectedTransaction.customerName, selectedTransaction.cashAmount, selectedTransaction.changeAmount, selectedTransaction.id || "", new Date(selectedTransaction.date));
  };
  const allTransactions = [...transactions.map(t => ({
    ...t,
    transactionType: t.type,
    amount: t.total
  }))];
  const filteredTransactions = allTransactions.filter(transaction => {
    if (transactionType !== 'all' && transaction.transactionType !== transactionType) {
      return false;
    }
    const searchLower = searchTerm.toLowerCase();
    const customerName = 'customerName' in transaction ? transaction.customerName : '';
    return transaction.id?.toString().toLowerCase().includes(searchLower) || customerName && customerName.toLowerCase().includes(searchLower);
  }).sort((a, b) => {
    switch (sortField) {
      case 'date':
        return sortDirection === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      case 'name':
        const nameA = 'customerName' in a ? a.customerName || '' : '';
        const nameB = 'customerName' in b ? b.customerName || '' : '';
        return sortDirection === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      case 'price':
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      case 'stock':
        return 0;
      default:
        return 0;
    }
  });
  if (allTransactions.length === 0) {
    return <div className="animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
            <p className="text-muted-foreground">Riwayat transaksi penjualan dan pembelian</p>
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
      </div>;
  }
  return <div className="animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transaksi</h2>
          <p className="text-muted-foreground">Riwayat transaksi penjualan dan pembelian</p>
        </div>
        <div className="flex items-center gap-2">
          <BluetoothPrinter />
        </div>
      </div>
      
      <TransactionFilter searchTerm={searchTerm} onSearchChange={setSearchTerm} transactionType={transactionType} onTransactionTypeChange={setTransactionType} sortField={sortField} sortDirection={sortDirection} onSortChange={(field, direction) => {
      setSortField(field as 'date' | 'amount' | 'name' | 'price' | 'stock');
      setSortDirection(direction);
    }} />
        
      <Tabs defaultValue="all" value={transactionType} onValueChange={setTransactionType}>
        <TabsContent value="all" className="space-y-0">
          {renderTransactionsTable(filteredTransactions)}
        </TabsContent>
        
        <TabsContent value="sale" className="space-y-0">
          {renderTransactionsTable(filteredTransactions)}
        </TabsContent>
        
        <TabsContent value="purchase" className="space-y-0">
          {renderTransactionsTable(filteredTransactions)}
        </TabsContent>
      </Tabs>
      
      {filteredTransactions.length === 0 && <div className="text-center py-8">
          <p className="text-muted-foreground">
            {transactionType === 'all' ? 'Tidak ada transaksi yang cocok dengan pencarian Anda' : `Tidak ada transaksi ${getTransactionTypeLabel(transactionType)} yang cocok dengan pencarian Anda`}
          </p>
        </div>}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogTitle>Detail Transaksi</DialogTitle>
          {selectedTransaction && <>
              <Receipt ref={receiptRef} items={selectedTransaction.products || []} total={selectedTransaction.amount || 0} date={new Date(selectedTransaction.date)} transactionId={selectedTransaction.id || ""} paymentMethod={selectedTransaction.paymentMethod || "cash"} customerName={selectedTransaction.customerName || "Pelanggan"} cashAmount={selectedTransaction.cashAmount} changeAmount={selectedTransaction.changeAmount} />
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => {
              setTimeout(handlePrint, 100);
            }}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Cetak (Browser)
                </Button>
                <Button variant="default" size="sm" onClick={handleBluetoothPrint}>
                  <PrinterIcon className="w-4 h-4 mr-2" />
                  Cetak Thermal
                </Button>
              </div>
            </>}
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {selectedTransaction && <Receipt ref={receiptRef} items={selectedTransaction.products || []} total={selectedTransaction.amount || 0} date={new Date(selectedTransaction.date)} transactionId={selectedTransaction.id || ""} paymentMethod={selectedTransaction.paymentMethod || "cash"} customerName={selectedTransaction.customerName || "Pelanggan"} cashAmount={selectedTransaction.cashAmount} changeAmount={selectedTransaction.changeAmount} />}
      </div>
    </div>;
  function renderTransactionsTable(transactions: any[]) {
    if (transactions.length === 0) {
      return <div className="text-center py-8">
          <p className="text-muted-foreground">
            {transactionType === 'all' ? 'Tidak ada transaksi yang cocok dengan pencarian Anda' : `Tidak ada transaksi ${getTransactionTypeLabel(transactionType)} yang cocok dengan pencarian Anda`}
          </p>
        </div>;
    }
    return <div className="rounded-lg overflow-hidden border">
        <Table>
          <TableBody>
            {transactions.map(transaction => <TableRow key={`${transaction.transactionType}-${transaction.id}`} className="cursor-pointer hover:bg-accent/50" onClick={() => {
            setSelectedTransaction(transaction);
            setIsDialogOpen(true);
          }}>
                <TableCell className="p-4 bg-white">
                  <div className="flex flex-col space-y-1">
                    <div className="font-medium">
                      {transaction.products && transaction.products.length > 0 ? transaction.products.map((item: any, index: number) => <span key={index}>
                              {item.product.name}{index < transaction.products.length - 1 ? ", " : ""}
                            </span>) : "Produk"}
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between">
                      <span>{transaction.id?.toString().substring(0, 8)}</span>
                      <span>{format(new Date(transaction.date), 'dd MMM yyyy', {
                      locale: id
                    })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>{transaction.customerName || "Pelanggan"}</span>
                      <span className="font-medium">Rp{transaction.amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {transaction.customerPhone || "-"}
                      </span>
                      <span className="text-sm text-green-600">
                        {transaction.profit ? `Rp${transaction.profit.toLocaleString('id-ID')}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {transaction.customerAddress || "-"}
                      </span>
                      <span className={`text-sm px-2 py-0.5 rounded-full ${transaction.transactionType === 'sale' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {getTransactionTypeLabel(transaction.transactionType)}
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </div>;
  }
  function toggleSort(field: 'date' | 'amount' | 'name' | 'price' | 'stock') {
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
      default:
        return type;
    }
  }
};
export default Transactions;