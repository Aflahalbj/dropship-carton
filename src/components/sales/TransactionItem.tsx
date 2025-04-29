
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface TransactionItemProps {
  transaction: any;
  onClick: () => void;
  getTransactionTypeLabel: (type: string) => string;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onClick,
  getTransactionTypeLabel
}) => {
  return (
    <TableRow 
      key={`${transaction.transactionType}-${transaction.id}`} 
      onClick={onClick}
    >
      <TableCell className="p-4 bg-white hover:bg-slate-50 cursor-pointer transition-colors duration-200" 
        onClick={onClick}>
        <div className="flex flex-col space-y-1">
          <div className="font-medium">
            {transaction.products && transaction.products.length > 0 ? 
              <span>
                {transaction.products.map((item: any, index: number) => 
                  `${item.product.name}${index < transaction.products.length - 1 ? ", " : ""}`
                ).join('')}
              </span>
            : "Produk"}
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
            <span className="text-sm">
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
    </TableRow>
  );
};

export default TransactionItem;
