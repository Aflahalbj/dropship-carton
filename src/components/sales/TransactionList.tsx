import React from 'react';
import { Table, TableBody, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import TransactionItem from './TransactionItem';
interface TransactionListProps {
  transactions: any[];
  onSelectTransaction: (transaction: any) => void;
  getTransactionTypeLabel: (type: string) => string;
  transactionType: string;
}
const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onSelectTransaction,
  getTransactionTypeLabel,
  transactionType
}) => {
  if (transactions.length === 0) {
    return <div className="text-center py-8">
        <p className="text-muted-foreground">
          {transactionType === 'all' ? 'Tidak ada transaksi yang cocok dengan pencarian Anda' : `Tidak ada transaksi ${getTransactionTypeLabel(transactionType)} yang cocok dengan pencarian Anda`}
        </p>
      </div>;
  }
  return <div className="rounded-lg overflow-hidden border">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-medium text-gray-700 bg-slate-100">Riwayat Transaksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => <TransactionItem key={`${transaction.transactionType}-${transaction.id}`} transaction={transaction} onClick={() => onSelectTransaction(transaction)} getTransactionTypeLabel={getTransactionTypeLabel} />)}
        </TableBody>
      </Table>
    </div>;
};
export default TransactionList;