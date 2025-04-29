import { toast } from "sonner";
import BluetoothPrinterService from "@/services/BluetoothPrinterService";
import { CartItem } from '../context/AppContext';

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
    const printerService = BluetoothPrinterService.getInstance();
    
    // Get currently connected device
    const connectedDevice = printerService.getConnectedDevice();
    
    if (!connectedDevice) {
      // If no device is connected, try to scan for printers
      const printers = await printerService.scanForPrinters();
      
      if (printers.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.");
        return;
      }
      
      // Try to connect to the first printer
      const connected = await printerService.connectToPrinter(printers[0]);
      if (!connected) return;
    }
    
    // Now print the receipt
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    await printerService.printReceipt(
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
    
    return true;
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.error("Gagal mencetak struk. Silakan coba lagi.");
    return false;
  }
};
