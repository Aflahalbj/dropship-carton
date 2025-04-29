
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import TransactionFilter from '@/components/TransactionFilter';
import EmptyTransactionState from '@/components/sales/EmptyTransactionState';
import SalesHeader from '@/components/sales/SalesHeader';
import TransactionList from '@/components/sales/TransactionList';
import TransactionDetailDialog from '@/components/sales/TransactionDetailDialog';

const Transactions = () => {
  const { transactions } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'productName' | 'price' | 'stock'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [transactionType, setTransactionType] = useState('all');
  const [timePeriod, setTimePeriod] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allTransactions = [...transactions.map(t => ({
    ...t,
    transactionType: t.type,
    amount: t.total,
    customerPhone: t.customerPhone || "",
    customerAddress: t.customerAddress || "",
  }))];

  // Helper function to filter transactions by time period
  const filterByTimePeriod = (transaction: any) => {
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    // Get the first day of the current week (Sunday)
    const firstDayOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    firstDayOfWeek.setDate(diff);
    firstDayOfWeek.setHours(0, 0, 0, 0);
    
    switch (timePeriod) {
      case 'today':
        return transactionDate >= today;
      case 'week':
        return transactionDate >= firstDayOfWeek;
      case 'month':
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      case 'year':
        return transactionDate.getFullYear() === currentYear;
      case 'all':
      default:
        return true;
    }
  };

  const filteredTransactions = allTransactions.filter(transaction => {
    // Filter by transaction type
    if (transactionType !== 'all' && transaction.transactionType !== transactionType) {
      return false;
    }
    
    // Filter by time period
    if (!filterByTimePeriod(transaction)) {
      return false;
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    const customerName = transaction.customerName || '';
    // Get product names from transaction items
    const productNames = transaction.products ? 
      transaction.products.map((item: any) => item.product.name.toLowerCase()).join(' ') : '';
    
    return transaction.id?.toString().toLowerCase().includes(searchLower) || 
           customerName.toLowerCase().includes(searchLower) ||
           productNames.includes(searchLower);
  }).sort((a, b) => {
    switch (sortField) {
      case 'date':
        return sortDirection === 'asc' 
          ? new Date(a.date).getTime() - new Date(b.date).getTime() 
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount':
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      case 'productName':
        // Sort by the first product's name in each transaction
        const getFirstProductName = (transaction: any) => {
          if (transaction.products && transaction.products.length > 0) {
            return transaction.products[0].product.name.toLowerCase();
          }
          return '';
        };
        const productNameA = getFirstProductName(a);
        const productNameB = getFirstProductName(b);
        return sortDirection === 'asc' 
          ? productNameA.localeCompare(productNameB) 
          : productNameB.localeCompare(productNameA);
      case 'price':
        return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      case 'stock':
        return 0;
      default:
        return 0;
    }
  });

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

  const handleSelectTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDialogOpen(true);
  };

  if (allTransactions.length === 0) {
    return (
      <div className="animate-slide-up">
        <SalesHeader 
          title="Transaksi" 
          description="Riwayat transaksi penjualan dan pembelian"
          transactionType={transactionType}
          onTransactionTypeChange={setTimePeriod} 
        />
        <EmptyTransactionState />
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <SalesHeader 
        title="Transaksi" 
        description="Riwayat transaksi penjualan dan pembelian"
        transactionType={transactionType}
        onTransactionTypeChange={setTimePeriod} 
      />
      
      <TransactionFilter 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        transactionType={transactionType}
        onTransactionTypeChange={setTransactionType}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field as 'date' | 'amount' | 'productName' | 'price' | 'stock');
          setSortDirection(direction);
        }}
        timePeriod={timePeriod}
        onTimePeriodChange={setTimePeriod}
        hideTransactionType={false}
      />
        
      <Tabs defaultValue="all" value={transactionType} onValueChange={setTransactionType}>
        <TabsContent value="all" className="space-y-0">
          <TransactionList 
            transactions={filteredTransactions}
            onSelectTransaction={handleSelectTransaction}
            getTransactionTypeLabel={getTransactionTypeLabel}
            transactionType={transactionType}
          />
        </TabsContent>
        
        <TabsContent value="sale" className="space-y-0">
          <TransactionList 
            transactions={filteredTransactions}
            onSelectTransaction={handleSelectTransaction}
            getTransactionTypeLabel={getTransactionTypeLabel}
            transactionType={transactionType}
          />
        </TabsContent>
        
        <TabsContent value="purchase" className="space-y-0">
          <TransactionList 
            transactions={filteredTransactions}
            onSelectTransaction={handleSelectTransaction}
            getTransactionTypeLabel={getTransactionTypeLabel}
            transactionType={transactionType}
          />
        </TabsContent>
      </Tabs>
      
      <TransactionDetailDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default Transactions;
