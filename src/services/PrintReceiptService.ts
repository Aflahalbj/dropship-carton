
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
      console.log("No printer connected, checking paired devices first");
      
      try {
        // Initialize printer system first
        await BluetoothPrinterService.init();
        
        // Try to get previously paired printers first before scanning
        const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
        console.log("Found paired printers:", pairedPrinters);
        
        if (pairedPrinters.length > 0) {
          // Try to connect to the first paired printer
          const printer = pairedPrinters[0];
          console.log("Attempting to connect to paired printer:", printer);
          toast.loading(`Mencoba menghubungkan ke printer yang dipasangkan: ${printer.name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printer);
          toast.dismiss("connecting-printer");
          
          if (connected) {
            console.log("Successfully connected to paired printer");
            toast.success(`Terhubung ke printer: ${printer.name}`);
          } else {
            console.log("Failed to connect to paired printer, scanning for new printers");
            toast.error("Gagal terhubung ke printer yang dipasangkan. Memindai printer baru...");
            
            // If connecting to paired printer fails, scan for new printers
            toast.info("Memindai printer Bluetooth baru...", { duration: 3000 });
            const printers = await BluetoothPrinterService.scanForPrinters(10000);
            
            if (printers.length === 0) {
              toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
                duration: 5000
              });
              return false;
            }
            
            // Try to connect to the first printer
            console.log("Attempting to connect to new printer:", printers[0]);
            toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
            
            const newConnected = await BluetoothPrinterService.connectToPrinter(printers[0]);
            toast.dismiss("connecting-printer");
            
            if (!newConnected) {
              toast.error("Gagal terhubung ke printer. Coba cek panduan pemecahan masalah.", {
                duration: 5000
              });
              return false;
            }
            
            toast.success(`Terhubung ke printer: ${printers[0].name}`);
          }
        } else {
          console.log("No paired printers found, scanning for new ones");
          toast.info("Tidak ada printer yang terhubung. Memindai printer...", { duration: 3000 });
          
          // If no paired printers, scan for new printers
          const printers = await BluetoothPrinterService.scanForPrinters(15000); // Use longer scan duration
          
          console.log("Found printers:", printers);
          
          if (printers.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.", {
              duration: 5000
            });
            return false;
          }
          
          // Try to connect to the first printer
          console.log("Attempting to connect to printer:", printers[0]);
          toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
          
          const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
          toast.dismiss("connecting-printer");
          
          if (!connected) {
            toast.error("Gagal terhubung ke printer. Coba cek panduan pemecahan masalah.", {
              duration: 5000
            });
            return false;
          }
          
          toast.success(`Terhubung ke printer: ${printers[0].name}`);
        }
      } catch (error) {
        console.error("Error scanning/connecting to printer:", error);
        toast.error("Periksa apakah printer Bluetooth Anda kompatibel dan dalam mode pairing", {
          duration: 5000
        });
        return false;
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
    
    // Try to print with extra formatting for EcoPrint compatibility
    const formattedReceipt = BluetoothPrinterService.formatForPrinter(receiptText);
    
    // Send the receipt to the printer using the plugin
    const success = await BluetoothPrinterService.printText(formattedReceipt);
    
    // If first attempt fails, try with different formatting
    if (!success) {
      console.log("First print attempt failed, trying alternative format");
      // Try with alternative formatting (for different printer models)
      const alternativeFormat = BluetoothPrinterService.formatAlternative(receiptText);
      const secondAttempt = await BluetoothPrinterService.printText(alternativeFormat);
      
      if (!secondAttempt) {
        toast.dismiss("printing-receipt");
        toast.error("Gagal mencetak struk. Coba sambungkan ulang printer.");
        return false;
      }
    }
    
    toast.dismiss("printing-receipt");
    toast.success("Struk berhasil dicetak!");
    return true;
    
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.dismiss("printing-receipt");
    toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export default { printReceipt };
