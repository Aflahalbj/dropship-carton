import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer as PrinterIcon, Share, ArrowLeft, Trash2 } from "lucide-react";
import Receipt from '../Receipt';
import { useReactToPrint } from 'react-to-print';
import { printReceipt } from '@/components/BluetoothPrinter';
import { toast } from "sonner";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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
  const [isProcessing, setIsProcessing] = useState(false);

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
      // Try Web Share API for mobile devices
      if (navigator.share) {
        await navigator.share({
          title: 'Struk Penjualan',
          text: `Struk penjualan dari transaksi ${transaction?.id || ''}`,
        });
      } else {
        // For desktop browsers, implement copy to clipboard functionality
        if (navigator.clipboard) {
          const text = `Struk penjualan dari transaksi ${transaction?.id || ''}\n` + 
                       `Tanggal: ${new Date(transaction?.date).toLocaleDateString('id-ID')}\n` +
                       `Total: Rp ${transaction?.amount?.toLocaleString('id-ID') || 0}`;
          await navigator.clipboard.writeText(text);
          toast.success("Detail transaksi disalin ke clipboard");
        } else {
          toast.error("Fitur berbagi tidak didukung oleh perangkat Anda.");
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Gagal membagikan struk.");
    }
  };

  const processReturn = () => {
    // Here you would implement the return logic
    toast.success("Proses pengembalian produk berhasil diinisiasi");
    // Close the main dialog after processing the return
    onOpenChange(false);
  };

  const confirmDelete = () => {
    // Here you would implement the delete transaction logic
    toast.success("Transaksi berhasil dihapus");
    // Close the main dialog after deleting
    onOpenChange(false);
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
              
              {/* Button row with 4 buttons */}
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
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center py-4 h-auto"
                    >
                      <ArrowLeft className="h-5 w-5 mb-1" />
                      <span className="text-xs">Return</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Proses Pengembalian Produk</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin memproses pengembalian produk untuk transaksi ini? 
                        Proses ini untuk produk yang exp, cacat, tidak sesuai, atau alasan lainnya.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={processReturn}>Proses Pengembalian</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center justify-center py-4 h-auto"
                    >
                      <Trash2 className="h-5 w-5 mb-1" />
                      <span className="text-xs">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus transaksi ini? 
                        Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
