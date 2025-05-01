
import BluetoothPrinterService from "./BluetoothPrinterService";
import { CartItem } from '../context/types';
import { toast } from "sonner";
import { generateReceiptText } from "../utils/receiptUtils";
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';

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
      deviceType: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown' 
    });
    
    // Get currently connected device
    const connectedDevice = BluetoothPrinterService.getConnectedDevice();
    console.log("Currently connected device:", connectedDevice);
    
    if (!connectedDevice) {
      console.log("No printer connected, scanning for printers");
      toast.info("Tidak ada printer yang terhubung. Memindai printer...");
      
      // If no device is connected, try to scan for printers
      const printers = await BluetoothPrinterService.scanForPrinters();
      
      console.log("Found printers:", printers);
      
      if (printers.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.");
        return false;
      }
      
      // Try to connect to the first printer
      console.log("Attempting to connect to printer:", printers[0]);
      toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`);
      
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      if (!connected) {
        toast.error("Gagal terhubung ke printer. Periksa koneksi dan coba lagi.");
        return false;
      }
      
      toast.success(`Terhubung ke printer: ${printers[0].name}`);
    } else {
      console.log("Using connected printer:", connectedDevice);
    }
    
    // Prepare receipt data
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    toast.loading("Mencetak struk...");
    console.log("Sending print command to printer");
    
    // Generate receipt preview
    console.log("Receipt preview:", generateReceiptText({
      products: items.map(item => ({ product: item.product, quantity: item.quantity })),
      amount: total,
      paymentMethod,
      customerName,
      cashAmount,
      changeAmount,
      id: transactionId,
      date
    }));
    
    // Print the receipt
    const success = await BluetoothPrinterService.printReceipt(
      items,
      total,
      paymentMethod,
      customerName,
      cashAmount,
      changeAmount,
      transactionId,
      date,
      storeName,
      storeLocation,
      storePhone
    );
    
    console.log("Print result:", success);
    
    // If printing failed, try one more time with plain text
    if (!success) {
      toast.error("Gagal mencetak struk. Mencoba metode alternatif...");
      
      // Wait a moment before trying again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try plain text method
      try {
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
        
        const connectedDevice = BluetoothPrinterService.getConnectedDevice();
        // Fix: Check for BluetoothSerial instance
        if (connectedDevice && typeof BluetoothSerial !== 'undefined') {
          await BluetoothSerial.write(receiptText);
          toast.success("Struk berhasil dicetak dengan metode alternatif!");
          return true;
        } else {
          return false;
        }
      } catch (fallbackError) {
        console.error("Fallback printing method failed:", fallbackError);
        return false;
      }
    }
    
    return success;
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export default { printReceipt };
