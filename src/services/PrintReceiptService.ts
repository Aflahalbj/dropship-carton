
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
    // Enhanced logging for debugging
    console.log("Attempting to print receipt:", { 
      items, 
      total, 
      transactionId,
      deviceType: Capacitor.getPlatform()
    });
    
    // Only proceed with Bluetooth printing on native platforms
    if (!Capacitor.isNativePlatform()) {
      toast.error("Printing hanya berfungsi di aplikasi Android/iOS");
      console.log("Not a native platform, printing unavailable");
      return false;
    }
    
    // Get currently connected device
    const connectedDevice = BluetoothPrinterService.getConnectedDevice();
    console.log("Currently connected device:", connectedDevice);
    
    if (!connectedDevice) {
      console.log("No printer connected, attempting auto-connection");
      toast.loading("Mencari printer Bluetooth...", { id: "finding-printer" });
      
      try {
        // Initialize printer system first with proper error handling
        await BluetoothPrinterService.init();
        
        // Try to get previously paired printers first before scanning
        const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
        console.log("Found paired printers:", pairedPrinters);
        toast.dismiss("finding-printer");
        
        if (pairedPrinters.length > 0) {
          // Try to connect to the first paired printer
          const printer = pairedPrinters[0];
          console.log("Attempting to connect to paired printer:", printer);
          toast.loading(`Mencoba menghubungkan ke printer: ${printer.name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printer);
          toast.dismiss("connecting-printer");
          
          if (connected) {
            console.log("Successfully connected to paired printer");
            toast.success(`Terhubung ke printer: ${printer.name}`);
          } else {
            console.log("Failed to connect to paired printer, scanning for new printers");
            toast.loading("Memindai printer Bluetooth baru...", { id: "scanning-printers", duration: 5000 });
            
            // If connecting to paired printer fails, scan for new printers
            // Use longer scan duration for printers in pairing mode
            const printers = await BluetoothPrinterService.scanForPrinters(25000); // Extended scan duration
            toast.dismiss("scanning-printers");
            
            if (printers.length === 0) {
              toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
                duration: 5000,
                action: {
                  label: "Coba Lagi",
                  onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
                }
              });
              return false;
            }
            
            // Show printer selection dialog if multiple printers found
            if (printers.length > 1) {
              // Use the first printer for now, the selection dialog is handled by BluetoothPrinterButton component
              console.log("Multiple printers found, using the first one:", printers[0]);
              toast.info(`Ditemukan ${printers.length} printer. Gunakan tombol Bluetooth untuk memilih printer.`, {
                duration: 5000
              });
            }
            
            // Try to connect to the first printer
            console.log("Attempting to connect to new printer:", printers[0]);
            toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
            
            const newConnected = await BluetoothPrinterService.connectToPrinter(printers[0]);
            toast.dismiss("connecting-printer");
            
            if (!newConnected) {
              toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.", {
                duration: 5000,
                action: {
                  label: "Coba Lagi",
                  onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
                }
              });
              return false;
            }
            
            toast.success(`Terhubung ke printer: ${printers[0].name}`);
          }
        } else {
          console.log("No paired printers found, scanning for new ones");
          toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
          
          // If no paired printers, scan for new printers with longer duration for pairing mode
          const printers = await BluetoothPrinterService.scanForPrinters(25000);
          toast.dismiss("scanning-printers");
          
          console.log("Found printers:", printers);
          
          if (printers.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
              duration: 5000,
              action: {
                label: "Coba Lagi",
                onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
              }
            });
            return false;
          }
          
          // Try to connect to the first printer
          console.log("Attempting to connect to printer:", printers[0]);
          toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          toast.dismiss("connecting-printer");
          
          if (!connected) {
            toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.", {
              duration: 5000,
              action: {
                label: "Coba Lagi",
                onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
              }
            });
            return false;
          }
          
          toast.success(`Terhubung ke printer: ${printers[0].name}`);
        }
      } catch (error) {
        console.error("Error scanning/connecting to printer:", error);
        toast.dismiss("finding-printer");
        toast.dismiss("scanning-printers");
        toast.dismiss("connecting-printer");
        toast.error("Periksa apakah printer Bluetooth Anda kompatibel dan dalam mode pairing", {
          duration: 5000,
          action: {
            label: "Coba Lagi",
            onClick: () => printReceipt(items, total, paymentMethod, customerName, cashAmount, changeAmount, transactionId, date)
          }
        });
        return false;
      }
    } else {
      // Verify the printer is still connected and ready
      const isReady = await BluetoothPrinterService.isPrinterReady();
      if (!isReady) {
        console.log("Printer connection lost, attempting to reconnect");
        
        toast.loading("Koneksi printer terputus. Menyambungkan ulang...", {
          id: "reconnecting"
        });
        
        const reconnected = await BluetoothPrinterService.connectToPrinter(connectedDevice);
        toast.dismiss("reconnecting");
        
        if (!reconnected) {
          toast.error("Gagal menghubungkan ulang ke printer. Memindai ulang...");
          
          // Try to scan for printers as fallback
          toast.loading("Memindai printer...", { id: "scanning" });
          const printers = await BluetoothPrinterService.scanForPrinters(20000);
          toast.dismiss("scanning");
          
          if (printers.length === 0) {
            toast.error("Gagal menemukan printer. Pastikan printer masih aktif dan dalam mode pairing.", {
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
          
          toast.success(`Terhubung ke printer: ${printers[0].name}`);
        }
      }
    }
    
    // Prepare receipt data
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    toast.loading("Mencetak struk...", {
      id: "printing-receipt",
      duration: 15000 // Extended timeout for printing
    });
    console.log("Sending print command to printer");
    
    // Generate receipt text
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
    
    console.log("Receipt to be printed:", receiptText);
    
    // Send the receipt to the printer (will try multiple formats internally)
    const success = await BluetoothPrinterService.printText(receiptText);
    
    if (success) {
      toast.dismiss("printing-receipt");
      toast.success("Struk berhasil dicetak!");
      return true;
    } else {
      toast.dismiss("printing-receipt");
      
      // If print fails, offer a retry option with better explanation
      toast.error("Gagal mencetak struk. Coba sambungkan ulang printer atau pastikan printer dalam mode siap cetak.", {
        action: {
          label: "Coba Lagi",
          onClick: async () => {
            // Try to reconnect and print again
            const device = BluetoothPrinterService.getConnectedDevice();
            if (device) {
              toast.loading("Mencoba ulang koneksi printer...", { id: "retry-connect" });
              const reconnected = await BluetoothPrinterService.connectToPrinter(device);
              toast.dismiss("retry-connect");
              
              if (reconnected) {
                // Try printing again with a simple message first to test the connection
                toast.loading("Testing printer...", { id: "test-print" });
                const testSuccess = await BluetoothPrinterService.printText("Tes Printer");
                toast.dismiss("test-print");
                
                if (testSuccess) {
                  // If test print works, try the full receipt again
                  toast.loading("Mencetak struk...", { id: "retry-printing" });
                  await BluetoothPrinterService.printText(receiptText);
                  toast.dismiss("retry-printing");
                }
              }
            } else {
              // No device available, need to scan and connect first
              toast.loading("Memindai printer...", { id: "retry-scan" });
              const printers = await BluetoothPrinterService.scanForPrinters(15000);
              toast.dismiss("retry-scan");
              
              if (printers.length > 0) {
                toast.loading("Menghubungkan ke printer...", { id: "retry-connect" });
                const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
                toast.dismiss("retry-connect");
                
                if (connected) {
                  toast.loading("Mencetak struk...", { id: "retry-printing" });
                  await BluetoothPrinterService.printText(receiptText);
                  toast.dismiss("retry-printing");
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
    console.error("Error printing receipt:", error);
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
