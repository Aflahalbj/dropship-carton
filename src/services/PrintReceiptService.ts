
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
      toast.loading(`Mencoba menghubungkan ke printer: ${printers[0].name}...`, { id: "connecting-printer" });
      
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      toast.dismiss("connecting-printer");
      
      if (!connected) {
        toast.error("Gagal terhubung ke printer. Periksa koneksi dan coba lagi.");
        return false;
      }
      
      toast.success(`Terhubung ke printer: ${printers[0].name}`);
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
    
    // Send the receipt to the printer using the new plugin
    const success = await BluetoothPrinterService.printText(receiptText);
    
    toast.dismiss("printing-receipt");
    
    if (success) {
      toast.success("Struk berhasil dicetak!");
      return true;
    } else {
      toast.error("Gagal mencetak struk. Silakan coba lagi.");
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
