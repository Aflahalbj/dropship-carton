
import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer as PrinterIcon } from "lucide-react";
import Receipt from '../Receipt';
import { useReactToPrint } from 'react-to-print';
import { printReceipt } from '@/components/BluetoothPrinter';

interface TransactionDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any | null;
}

const TransactionDetailDialog: React.FC<TransactionDetailDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  transaction
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: 'Struk Penjualan',
    contentRef: receiptRef,
    onAfterPrint: () => {
      console.log('Print job completed');
    }
  });

  const handleBluetoothPrint = async () => {
    if (!transaction) return;
    await printReceipt(
      transaction.products, 
      transaction.total, 
      transaction.paymentMethod || 'cash', 
      transaction.customerName, 
      transaction.cashAmount, 
      transaction.changeAmount, 
      transaction.id || "", 
      new Date(transaction.date)
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogTitle>Detail Transaksi</DialogTitle>
          {transaction && (
            <>
              <Receipt 
                ref={receiptRef} 
                items={transaction.products || []} 
                total={transaction.amount || 0} 
                date={new Date(transaction.date)} 
                transactionId={transaction.id || ""} 
                paymentMethod={transaction.paymentMethod || "cash"} 
                customerName={transaction.customerName || "Pelanggan"} 
                cashAmount={transaction.cashAmount} 
                changeAmount={transaction.changeAmount} 
              />
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
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <div className="hidden">
        {transaction && (
          <Receipt 
            ref={receiptRef} 
            items={transaction.products || []} 
            total={transaction.amount || 0} 
            date={new Date(transaction.date)} 
            transactionId={transaction.id || ""} 
            paymentMethod={transaction.paymentMethod || "cash"} 
            customerName={transaction.customerName || "Pelanggan"} 
            cashAmount={transaction.cashAmount} 
            changeAmount={transaction.changeAmount} 
          />
        )}
      </div>
    </>
  );
};

export default TransactionDetailDialog;
