
import BluetoothPrinterService from "./BluetoothPrinterService";
import { CartItem } from '../context/types';
import { toast } from "sonner";
import { generateReceiptText } from "../utils/receiptUtils";
import { Capacitor } from '@capacitor/core';

export const printReceipt = async (
  items: CartItem[],
  total: number,
  paymentMethod: string,
  customerName: string | undefined,
  cashAmount: number | undefined,
  changeAmount: number | undefined,
  transactionId: string,
  date: Date
) => {
  try {
    console.log("Memulai proses cetak struk untuk transaksi:", { 
      items, 
      total, 
      transactionId,
      devicePlatform: Capacitor.getPlatform()
    });
    
    if (!Capacitor.isNativePlatform()) {
      toast.error("Printing hanya berfungsi di aplikasi Android/iOS");
      console.log("Bukan platform native, cetak tidak tersedia");
      return false;
    }
    
    // Memastikan printer service terinisialisasi dengan benar
    console.log("Menginisialisasi printer service...");
    const initialized = await BluetoothPrinterService.init();
    
    if (!initialized) {
      console.log("Gagal menginisialisasi printer service");
      toast.error("Gagal menginisialisasi printer. Pastikan Bluetooth aktif dan izin diberikan", {
        action: {
          label: "Coba Lagi",
          onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
        },
        duration: 5000
      });
      return false;
    }
    
    // Periksa printer yang terhubung
    const connectedDevice = BluetoothPrinterService.getConnectedDevice();
    console.log("Printer yang terhubung:", connectedDevice);
    
    if (!connectedDevice) {
      console.log("Tidak ada printer yang terhubung, mencoba pencarian otomatis");
      toast.loading("Mencari printer tersedia...", { id: "finding-printer" });
      
      try {
        // Pertama coba mendapatkan printer yang sudah dipasangkan
        const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
        console.log("Printer yang sudah dipasangkan:", pairedPrinters);
        toast.dismiss("finding-printer");
        
        if (pairedPrinters.length > 0) {
          // Mencoba terhubung ke printer pertama
          const printer = pairedPrinters[0];
          console.log("Mencoba terhubung ke printer yang sudah dipasangkan:", printer);
          toast.loading(`Menghubungkan ke ${printer.name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printer);
          toast.dismiss("connecting-printer");
          
          if (connected) {
            console.log("Berhasil terhubung ke printer yang sudah dipasangkan");
            toast.success(`Terhubung ke ${printer.name}`);
          } else {
            console.log("Gagal terhubung ke printer yang sudah dipasangkan, memindai printer baru");
            toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
            
            // Jika gagal terhubung ke printer yang sudah dipasangkan, pindai printer baru
            const printers = await BluetoothPrinterService.scanForPrinters(30000); // Durasi pemindaian lebih lama
            toast.dismiss("scanning-printers");
            
            if (printers.length === 0) {
              toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing (lampu berkedip).", {
                duration: 8000,
                action: {
                  label: "Troubleshoot",
                  onClick: () => {
                    // Tampilkan tips EcoPrint
                    const tips = BluetoothPrinterService.getEcoPrintTroubleshootingTips();
                    toast.info(tips.join("\n\n"), { duration: 15000 });
                  }
                }
              });
              return false;
            }
            
            // Coba terhubung ke printer pertama dari hasil pindai
            console.log("Mencoba terhubung ke printer baru:", printers[0]);
            toast.loading(`Menghubungkan ke ${printers[0].name}...`, { id: "connecting-new-printer" });
            
            const newConnected = await BluetoothPrinterService.connectToPrinter(printers[0]);
            toast.dismiss("connecting-new-printer");
            
            if (!newConnected) {
              toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing (lampu berkedip).", {
                duration: 8000,
                action: {
                  label: "Troubleshoot",
                  onClick: () => {
                    // Tampilkan tips EcoPrint
                    const tips = BluetoothPrinterService.getEcoPrintTroubleshootingTips();
                    toast.info(tips.join("\n\n"), { duration: 15000 });
                  }
                }
              });
              return false;
            }
            
            toast.success(`Terhubung ke ${printers[0].name}`);
          }
        } else {
          console.log("Tidak ada printer yang sudah dipasangkan, memindai printer baru");
          toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
          
          // Jika tidak ada printer yang dipasangkan, pindai printer baru
          const printers = await BluetoothPrinterService.scanForPrinters(30000); // Durasi pemindaian lebih lama
          toast.dismiss("scanning-printers");
          
          console.log("Hasil pemindaian printer:", printers);
          
          if (printers.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing (lampu berkedip).", {
              duration: 8000,
              action: {
                label: "Troubleshoot",
                onClick: () => {
                  // Tampilkan tips EcoPrint
                  const tips = BluetoothPrinterService.getEcoPrintTroubleshootingTips();
                  toast.info(tips.join("\n\n"), { duration: 15000 });
                }
              }
            });
            return false;
          }
          
          // Coba terhubung ke printer pertama
          console.log("Mencoba terhubung ke printer:", printers[0]);
          toast.loading(`Menghubungkan ke ${printers[0].name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          toast.dismiss("connecting-printer");
          
          if (!connected) {
            toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing (lampu berkedip).", {
              duration: 8000,
              action: {
                label: "Troubleshoot",
                onClick: () => {
                  // Tampilkan tips EcoPrint
                  const tips = BluetoothPrinterService.getEcoPrintTroubleshootingTips();
                  toast.info(tips.join("\n\n"), { duration: 15000 });
                }
              }
            });
            return false;
          }
          
          toast.success(`Terhubung ke ${printers[0].name}`);
        }
      } catch (error) {
        console.error("Error saat memindai/menghubungkan ke printer:", error);
        toast.dismiss("finding-printer");
        toast.dismiss("scanning-printers");
        toast.dismiss("connecting-printer");
        toast.error("Pastikan printer Bluetooth Anda kompatibel dan dalam mode pairing (lampu berkedip)", {
          duration: 8000,
          action: {
            label: "Coba Lagi",
            onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
          }
        });
        return false;
      }
    } else {
      // Verifikasi printer masih terhubung dan siap
      console.log("Verifikasi koneksi printer yang sudah terhubung...");
      const isReady = await BluetoothPrinterService.isPrinterReady();
      
      if (!isReady) {
        console.log("Koneksi printer terputus, mencoba menghubungkan ulang");
        
        toast.loading("Koneksi printer terputus. Menyambungkan ulang...", {
          id: "reconnecting"
        });
        
        const reconnected = await BluetoothPrinterService.connectToPrinter(connectedDevice);
        toast.dismiss("reconnecting");
        
        if (!reconnected) {
          console.log("Gagal menghubungkan ulang, memindai printer lain");
          toast.error("Gagal menghubungkan ulang ke printer. Memindai ulang...");
          
          // Coba memindai printer lain
          toast.loading("Memindai printer...", { id: "scanning" });
          const printers = await BluetoothPrinterService.scanForPrinters(30000);
          toast.dismiss("scanning");
          
          if (printers.length === 0) {
            toast.error("Gagal menemukan printer. Pastikan printer masih aktif dan dalam mode pairing (lampu berkedip).", {
              action: {
                label: "Coba Lagi",
                onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
              }
            });
            return false;
          }
          
          toast.loading("Menyambungkan ke printer...", { id: "connecting" });
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          toast.dismiss("connecting");
          
          if (!connected) {
            toast.error("Gagal menghubungkan ke printer.", {
              action: {
                label: "Coba Lagi",
                onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
              }
            });
            return false;
          }
          
          toast.success(`Terhubung ke ${printers[0].name}`);
        } else {
          toast.success("Berhasil terhubung kembali ke printer");
        }
      } else {
        console.log("Printer terhubung dan siap");
      }
    }
    
    // Menyiapkan konten struk
    console.log("Menyiapkan data struk...");
    
    toast.loading("Mencetak struk...", {
      id: "printing-receipt",
      duration: 20000 // Timeout yang lebih lama untuk mencetak
    });
    
    // Generate teks struk
    const receiptText = generateReceiptText({
      products: items.map(item => ({ product: item.product, quantity: item.quantity })),
      amount: total,
      paymentMethod,
      customerName,
      cashAmount,
      changeAmount,
      id: transactionId,
      date
    });
    
    console.log("Konten struk yang akan dicetak:", receiptText);
    
    // Kirim struk ke printer dengan berbagai format
    const success = await BluetoothPrinterService.printText(receiptText);
    
    if (success) {
      toast.dismiss("printing-receipt");
      toast.success("Struk berhasil dicetak!");
      return true;
    } else {
      toast.dismiss("printing-receipt");
      
      // Jika pencetakan gagal, tawarkan opsi coba ulang dengan penjelasan yang lebih baik
      toast.error("Gagal mencetak struk. Printer mungkin kehabisan kertas atau perlu diatur ulang.", {
        action: {
          label: "Coba Lagi",
          onClick: async () => {
            // Coba sambungkan ulang dan cetak lagi
            const device = BluetoothPrinterService.getConnectedDevice();
            if (device) {
              toast.loading("Mencoba ulang koneksi printer...", { id: "retry-connect" });
              const reconnected = await BluetoothPrinterService.connectToPrinter(device);
              toast.dismiss("retry-connect");
              
              if (reconnected) {
                // Coba cetak lagi dengan pesan sederhana terlebih dahulu
                toast.loading("Testing printer...", { id: "test-print" });
                const testSuccess = await BluetoothPrinterService.printText("Tes Printer");
                toast.dismiss("test-print");
                
                if (testSuccess) {
                  // Jika test cetak berhasil, coba cetak struk lengkap lagi
                  toast.loading("Mencetak struk...", { id: "retry-printing" });
                  await BluetoothPrinterService.printText(receiptText);
                  toast.dismiss("retry-printing");
                  toast.success("Struk berhasil dicetak!");
                }
              }
            } else {
              // Tidak ada perangkat tersedia, perlu memindai dan terhubung terlebih dahulu
              toast.loading("Memindai printer...", { id: "retry-scan" });
              const printers = await BluetoothPrinterService.scanForPrinters(20000);
              toast.dismiss("retry-scan");
              
              if (printers.length > 0) {
                toast.loading("Menghubungkan ke printer...", { id: "retry-connect" });
                const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
                toast.dismiss("retry-connect");
                
                if (connected) {
                  toast.loading("Mencetak struk...", { id: "retry-printing" });
                  await BluetoothPrinterService.printText(receiptText);
                  toast.dismiss("retry-printing");
                  toast.success("Struk berhasil dicetak!");
                }
              }
            }
          }
        },
        duration: 15000
      });
      
      return false;
    }
    
  } catch (error) {
    console.error("Error mencetak struk:", error);
    toast.dismiss("printing-receipt");
    toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`, {
      action: {
        label: "Coba Lagi",
        onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
      }
    });
    return false;
  }
};

export default { printReceipt };
