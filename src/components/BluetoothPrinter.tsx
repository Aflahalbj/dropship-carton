
import { toast } from "sonner";
import BluetoothPrinterService from "@/services/BluetoothPrinterService";
import { CartItem } from '../context/AppContext';
import React from 'react';
import { Printer } from 'lucide-react';
import { Button } from "./ui/button";

interface BluetoothPrinterProps {
  className?: string;
}

export const BluetoothPrinter: React.FC<BluetoothPrinterProps> = ({ className }) => {
  const handleScanForPrinters = async () => {
    try {
      const printers = await BluetoothPrinterService.scanForPrinters();
      
      if (printers.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.");
        return;
      }
      
      // Try to connect to the first printer
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      if (connected) {
        toast.success(`Terhubung ke printer: ${printers[0].name}`);
      }
    } catch (error) {
      console.error("Error scanning for printers:", error);
      toast.error("Gagal mencari printer. Pastikan Bluetooth diaktifkan.");
    }
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className={`aspect-square w-12 h-12 rounded-lg bg-slate-50 border border-gray-300 ${className}`}
      onClick={handleScanForPrinters}
    >
      <Printer className="h-4 w-4" />
    </Button>
  );
};

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
    // Get currently connected device
    const connectedDevice = BluetoothPrinterService.getConnectedDevice();
    
    if (!connectedDevice) {
      // If no device is connected, try to scan for printers
      const printers = await BluetoothPrinterService.scanForPrinters();
      
      if (printers.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.");
        return;
      }
      
      // Try to connect to the first printer
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      if (!connected) return;
    }
    
    // Now print the receipt
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
    await BluetoothPrinterService.printReceipt(
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
