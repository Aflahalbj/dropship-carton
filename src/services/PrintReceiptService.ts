
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
        // Initialize printer system first
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
            const printers = await BluetoothPrinterService.scanForPrinters(20000); // Longer scan duration
            toast.dismiss("scanning-printers");
            
            if (printers.length === 0) {
              toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
                duration: 5000
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
                duration: 5000
              });
              return false;
            }
            
            toast.success(`Terhubung ke printer: ${printers[0].name}`);
          }
        } else {
          console.log("No paired printers found, scanning for new ones");
          toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
          
          // If no paired printers, scan for new printers with longer duration
          const printers = await BluetoothPrinterService.scanForPrinters(20000);
          toast.dismiss("scanning-printers");
          
          console.log("Found printers:", printers);
          
          if (printers.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
              duration: 5000
            });
            return false;
          }
          
          // Show printer selection if multiple printers found
          if (printers.length > 1) {
            // Use the first printer for now, the selection dialog is handled by BluetoothPrinterButton component
            console.log("Multiple printers found, using the first one:", printers[0]);
            toast.info(`Ditemukan ${printers.length} printer. Gunakan tombol Bluetooth untuk memilih printer.`, {
              duration: 5000
            });
          }
          
          // Try to connect to the first printer
          console.log("Attempting to connect to printer:", printers[0]);
          toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          toast.dismiss("connecting-printer");
          
          if (!connected) {
            toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.", {
              duration: 5000
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
          duration: 5000
        });
        return false;
      }
    } else {
      // Verify the printer is still connected and ready
      const isReady = await BluetoothPrinterService.isPrinterReady();
      if (!isReady) {
        console.log("Printer connection lost, attempting to reconnect");
        const reconnected = await BluetoothPrinterService.connectToPrinter(connectedDevice);
        if (!reconnected) {
          toast.error("Koneksi ke printer terputus. Menghubungkan ulang...");
          
          // Try to scan for printers as fallback
          const printers = await BluetoothPrinterService.scanForPrinters(15000);
          if (printers.length === 0) {
            toast.error("Gagal menghubungkan ulang ke printer. Pastikan printer masih aktif.");
            return false;
          }
          
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          if (!connected) {
            toast.error("Gagal menghubungkan ulang ke printer.");
            return false;
          }
        }
      }
    }
    
    // Prepare receipt data
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    toast.loading("Mencetak struk...", {
      id: "printing-receipt",
      duration: 10000
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
      
      // If print fails, offer a retry option
      toast.error("Gagal mencetak struk. Coba sambungkan ulang printer.", {
        action: {
          label: "Coba Lagi",
          onClick: async () => {
            // Try to reconnect and print again
            const device = BluetoothPrinterService.getConnectedDevice();
            if (device) {
              const reconnected = await BluetoothPrinterService.connectToPrinter(device);
              if (reconnected) {
                // Try printing again with a simple message first to test the connection
                const testSuccess = await BluetoothPrinterService.printText("Tes Printer");
                if (testSuccess) {
                  // If test print works, try the full receipt again
                  await BluetoothPrinterService.printText(receiptText);
                }
              }
            } else {
              // No device available, need to scan and connect first
              const printers = await BluetoothPrinterService.scanForPrinters(15000);
              if (printers.length > 0) {
                const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
                if (connected) {
                  await BluetoothPrinterService.printText(receiptText);
                }
              }
            }
          }
        },
        duration: 10000
      });
      
      return false;
    }
    
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.dismiss("printing-receipt");
    toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export default { printReceipt };
