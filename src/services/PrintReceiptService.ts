
import BluetoothPrinterService from "./BluetoothPrinterService";
import { CartItem } from '../context/types';
import { toast } from "sonner";
import { generateReceiptText } from "../utils/receiptUtils";
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
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
    
    // Try to print directly with BluetoothSerial first
    try {
      if (typeof BluetoothSerial !== 'undefined') {
        // Check if we have a connected device before attempting to write
        const isConnected = await BluetoothSerial.isConnected();
        console.log("BluetoothSerial isConnected:", isConnected);
        
        if (!isConnected && connectedDevice) {
          console.log("Connecting with BluetoothSerial to:", connectedDevice.address);
          await BluetoothSerial.connect(connectedDevice.address);
        }
        
        // Add a command to initialize the printer before sending the text
        // ESC @ - Initialize printer
        // ESC ! 0 - Set default text style
        const initCommands = '\x1B\x40\x1B\x21\x00';
        await BluetoothSerial.write(initCommands + receiptText + '\n\n\n\n\n');
        
        console.log("Receipt sent via BluetoothSerial");
        toast.dismiss("printing-receipt");
        toast.success("Struk berhasil dicetak!");
        return true;
      }
    } catch (serialError) {
      console.error("BluetoothSerial error:", serialError);
      // Continue to fallback method if this fails
    }
    
    // If BluetoothSerial direct method failed, try with the PrinterService
    console.log("Falling back to PrinterService method");
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
    
    console.log("PrinterService print result:", success);
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
