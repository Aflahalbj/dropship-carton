
import BluetoothPrinterService from "./BluetoothPrinterService";
import { CartItem } from '../context/types';
import { toast } from "sonner";

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
    // Log untuk debugging
    console.log("Attempting to print receipt:", { items, total, transactionId });
    
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
      toast.info(`Mencoba menghubungkan ke printer: ${printers[0].name}...`);
      
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      if (!connected) {
        toast.error("Gagal terhubung ke printer");
        return false;
      }
      
      toast.success(`Terhubung ke printer: ${printers[0].name}`);
    } else {
      console.log("Using connected printer:", connectedDevice);
    }
    
    // Now print the receipt
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    toast.info("Mencetak struk...");
    console.log("Sending print command to printer");
    
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
    return success;
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export default { printReceipt };
