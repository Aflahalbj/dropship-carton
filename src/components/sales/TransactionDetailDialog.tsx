import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer as PrinterIcon, Share, ArrowLeft, Trash2 } from "lucide-react";
import Receipt from '../Receipt';
import { useReactToPrint } from 'react-to-print';
import { printReceipt } from '@/components/BluetoothPrinter';
import { toast } from "sonner";

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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Struk Penjualan',
          text: `Struk penjualan dari transaksi ${transaction?.id || ''}`,
        });
      } else {
        toast.error("Fitur berbagi tidak didukung oleh perangkat Anda.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Gagal membagikan struk.");
    }
  };

  const handleReturn = () => {
    onOpenChange(false);
  };

  const handleDelete = () => {
    // For now just show a toast message
    toast.info("Fitur hapus transaksi akan segera hadir.");
    // In a real implementation, you would call a function to delete the transaction
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
              
              {/* New button row with 4 buttons */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                <Button 
                  onClick={handleBluetoothPrint} 
                  variant="outline" 
                  className="flex flex-col items-center justify-center py-4 h-auto"
                >
                  <PrinterIcon className="h-5 w-5 mb-1" />
                  <span className="text-xs">Print</span>
                </Button>
                
                <Button 
                  onClick={handleShare} 
                  variant="outline" 
                  className="flex flex-col items-center justify-center py-4 h-auto"
                >
                  <Share className="h-5 w-5 mb-1" />
                  <span className="text-xs">Share</span>
                </Button>
                
                <Button 
                  onClick={handleReturn} 
                  variant="outline" 
                  className="flex flex-col items-center justify-center py-4 h-auto"
                >
                  <ArrowLeft className="h-5 w-5 mb-1" />
                  <span className="text-xs">Return</span>
                </Button>
                
                <Button 
                  onClick={handleDelete} 
                  variant="outline" 
                  className="flex flex-col items-center justify-center py-4 h-auto"
                >
                  <Trash2 className="h-5 w-5 mb-1" />
                  <span className="text-xs">Delete</span>
                </Button>
              </div>

              {/* For backward compatibility, keep the old buttons hidden */}
              <div className="hidden">
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
