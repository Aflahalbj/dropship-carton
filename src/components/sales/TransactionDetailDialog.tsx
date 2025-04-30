
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer as PrinterIcon, Share, ArrowLeft, Trash2 } from "lucide-react";
import Receipt from '../Receipt';
import { useReactToPrint } from 'react-to-print';
import { printReceipt } from '@/components/BluetoothPrinter';
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  const [restoreStock, setRestoreStock] = useState(true);
  const { deleteTransaction } = useAppContext();

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
      const receiptText = generateReceiptText(transaction);
      
      // Create a file from the receipt text for sharing
      const blob = new Blob([receiptText], { type: 'text/plain' });
      
      // Try native share API first
      if (navigator.canShare) {
        try {
          // Create a File object instead of using Blob directly
          const file = new File([blob], "struk-penjualan.txt", { type: 'text/plain' });
          
          // Check if we can share files
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Struk Penjualan',
              text: `Struk penjualan dari transaksi ${transaction?.id || ''}`,
            });
            return;
          } else {
            // Fall back to text sharing if file sharing isn't supported
            await navigator.share({
              title: 'Struk Penjualan',
              text: receiptText,
            });
            return;
          }
        } catch (err) {
          console.error("Error sharing:", err);
          // Fall back to clipboard
        }
      }
      
      // For desktop browsers, implement copy to clipboard functionality
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(receiptText);
        toast.success("Detail transaksi disalin ke clipboard");
      } else {
        toast.error("Fitur berbagi tidak didukung oleh perangkat Anda.");
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Gagal membagikan struk.");
    }
  };
  
  // Helper function to generate receipt text for sharing
  const generateReceiptText = (transaction: any): string => {
    if (!transaction) return "";
    
    let text = "";
    text += "TOKO ABDULLAH\n";
    text += "TANGERANG\n";
    text += "083880863610\n\n";
    
    if (transaction.customerName) {
      text += `Tuan/Bos: ${transaction.customerName}\n`;
    }
    text += `--------------------------------\n`;
    text += `No - ${transaction.id?.slice(-2) || "01"}   `;
    text += `${new Date(transaction.date).toLocaleTimeString('id-ID')}   `;
    text += `${new Date(transaction.date).toLocaleDateString('id-ID')}\n`;
    text += `--------------------------------\n\n`;
    
    // Items
    transaction.products?.forEach((item: any) => {
      text += `${item.product.name}\n`;
      text += `${item.quantity} x ${item.product.price.toLocaleString('id-ID')}`;
      text += `          Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}\n\n`;
    });
    
    text += `--------------------------------\n`;
    text += `Total                Rp ${transaction.amount?.toLocaleString('id-ID')}\n`;
    text += `Bayar (${transaction.paymentMethod === 'cash' ? 'Cash' : 'Transfer'})      Rp ${(transaction.cashAmount || transaction.amount).toLocaleString('id-ID')}\n`;
    text += `Kembali              Rp ${(transaction.changeAmount || 0).toLocaleString('id-ID')}\n\n`;
    
    text += `\n\n`;
    text += `      Terimakasih telah berbelanja di toko kami      \n`;
    text += `                      ^_^                      \n`;
    
    return text;
  };

  const processReturn = () => {
    // Here you would implement the return logic
    toast.success("Proses pengembalian produk berhasil diinisiasi");
    // Close the main dialog after processing the return
    onOpenChange(false);
  };

  const confirmDelete = () => {
    if (transaction) {
      // Fixed: Pass restoreStock as a parameter object rather than a separate argument
      const success = deleteTransaction({
        id: transaction.id,
        restoreStock
      });
      
      if (success) {
        if (restoreStock) {
          toast.success("Transaksi berhasil dihapus dan stok produk dikembalikan");
        } else {
          toast.success("Transaksi berhasil dihapus tanpa mengembalikan stok");
        }
      } else {
        toast.error("Gagal menghapus transaksi");
      }
      
      // Close the main dialog after deleting
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogTitle>Detail Transaksi</DialogTitle>
          <DialogDescription>
            Lihat dan kelola detail transaksi penjualan
          </DialogDescription>
          
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
                      </AlertDialogDescription>
                      <div className="flex items-center space-x-2 mt-4">
                        <Checkbox 
                          id="restore-stock"
                          checked={restoreStock}
                          onCheckedChange={(checked) => setRestoreStock(checked as boolean)}
                        />
                        <label
                          htmlFor="restore-stock"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Kembalikan stok barang
                        </label>
                      </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={confirmDelete} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Hapus Transaksi
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
