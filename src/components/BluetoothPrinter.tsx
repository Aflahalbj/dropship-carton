
import { toast } from "sonner";
import BluetoothPrinterService, { PrinterDevice } from "@/services/BluetoothPrinterService";
import { CartItem } from '../context/AppContext';
import React, { useState } from 'react';
import { Bluetooth, Loader2 } from 'lucide-react';
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BluetoothPrinterProps {
  className?: string;
}

export const BluetoothPrinter: React.FC<BluetoothPrinterProps> = ({ className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleScanForPrinters = async () => {
    try {
      setIsScanning(true);
      const foundPrinters = await BluetoothPrinterService.scanForPrinters();
      
      if (foundPrinters.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.");
        return;
      }
      
      setPrinters(foundPrinters);
      setShowPrinterDialog(true);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      toast.error("Gagal mencari printer. Pastikan Bluetooth diaktifkan.");
    } finally {
      setIsScanning(false);
    }
  };
  
  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      setConnecting(printer.id);
      const connected = await BluetoothPrinterService.connectToPrinter(printer);
      
      if (connected) {
        toast.success(`Terhubung ke printer: ${printer.name}`);
        setShowPrinterDialog(false);
      }
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      toast.error("Gagal terhubung ke printer");
    } finally {
      setConnecting(null);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className={`aspect-square w-12 h-12 rounded-lg bg-slate-50 border border-gray-300 ${className}`}
        onClick={handleScanForPrinters}
        disabled={isScanning}
      >
        {isScanning ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bluetooth className="h-4 w-4" />
        )}
      </Button>
      
      <Dialog open={showPrinterDialog} onOpenChange={setShowPrinterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perangkat Printer Bluetooth</DialogTitle>
            <DialogDescription>
              Pilih printer yang ingin dihubungkan
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {printers.length > 0 ? (
              printers.map((printer) => (
                <Button
                  key={printer.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => connectToPrinter(printer)}
                  disabled={connecting === printer.id}
                >
                  {connecting === printer.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Bluetooth className="mr-2 h-4 w-4" />
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{printer.name}</span>
                    <span className="text-xs text-gray-500">{printer.address}</span>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-center py-4 text-gray-500">Tidak ada printer yang ditemukan</p>
            )}
          </div>
          
          <Button 
            className="w-full mt-2" 
            onClick={handleScanForPrinters}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memindai...
              </>
            ) : (
              <>
                <Bluetooth className="mr-2 h-4 w-4" />
                Pindai Ulang
              </>
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
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
        return false;
      }
      
      // Try to connect to the first printer
      const connected = await BluetoothPrinterService.connectToPrinter(printers[0]);
      if (!connected) {
        toast.error("Gagal terhubung ke printer");
        return false;
      }
    }
    
    // Now print the receipt
    const storeName = "TOKO ABDULLAH";
    const storeLocation = "TANGERANG";
    const storePhone = "083880863610";
    
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
    
    return success;
  } catch (error) {
    console.error("Error printing receipt:", error);
    toast.error("Gagal mencetak struk. Silakan coba lagi.");
    return false;
  }
};

export default BluetoothPrinter;
