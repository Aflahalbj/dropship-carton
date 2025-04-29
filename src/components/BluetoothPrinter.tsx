import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bluetooth, X, RefreshCw, Check, Printer } from "lucide-react";
import BluetoothPrinterService, { PrinterDevice } from '../services/BluetoothPrinterService';
import { CartItem } from '../context/AppContext';
import { toast } from "sonner";

interface BluetoothPrinterProps {
  className?: string;
}

export const BluetoothPrinter: React.FC<BluetoothPrinterProps> = ({ className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterDevice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const checkConnectedDevice = async () => {
      const connectedDevice = BluetoothPrinterService.getConnectedDevice();
      if (connectedDevice) {
        setSelectedPrinter(connectedDevice);
      }
    };
    
    checkConnectedDevice();
  }, []);

  const scanForPrinters = async () => {
    setIsScanning(true);
    try {
      const devices = await BluetoothPrinterService.scanForPrinters();
      setPrinters(devices);
    } catch (error) {
      console.error('Failed to scan for printers:', error);
      toast.error('Gagal mencari printer bluetooth');
    } finally {
      setIsScanning(false);
    }
  };

  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      const connected = await BluetoothPrinterService.connectToPrinter(printer);
      if (connected) {
        setSelectedPrinter(printer);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.error('Gagal menghubungkan ke printer');
    }
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant={selectedPrinter ? "outline" : "secondary"}
            size="icon"
            className={`rounded-lg ${className}`}
            onClick={() => {
              if (!selectedPrinter) {
                setDialogOpen(true);
                scanForPrinters();
              }
            }}
          >
            {selectedPrinter ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Bluetooth className="w-4 h-4" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Printer Bluetooth</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Pilih printer Bluetooth untuk mencetak struk
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={scanForPrinters}
              disabled={isScanning}
              className="flex items-center gap-2"
            >
              {isScanning ? 'Mencari...' : 'Refresh'}
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {isScanning ? (
            <div className="py-8 text-center">
              <RefreshCw className="animate-spin w-8 h-8 mx-auto mb-4 text-primary" />
              <p>Mencari printer Bluetooth...</p>
            </div>
          ) : (
            <div className="space-y-2">
              {printers.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">Tidak ada printer yang ditemukan</p>
                  <Button onClick={scanForPrinters}>Cari Lagi</Button>
                </div>
              ) : (
                printers.map(printer => (
                  <div
                    key={printer.id}
                    className="flex justify-between items-center p-3 border rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => connectToPrinter(printer)}
                  >
                    <div>
                      <p className="font-medium">{printer.name}</p>
                      <p className="text-xs text-muted-foreground">{printer.address}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Hubungkan
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
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
  date: Date,
  storeName: string = 'Toko Dropship'
): Promise<boolean> => {
  const connectedDevice = BluetoothPrinterService.getConnectedDevice();
  
  if (!connectedDevice) {
    toast.error('Tidak ada printer yang terhubung. Silakan hubungkan printer terlebih dahulu.');
    return false;
  }
  
  return BluetoothPrinterService.printReceipt(
    items, 
    total, 
    paymentMethod, 
    customerName, 
    cashAmount, 
    changeAmount, 
    transactionId, 
    date,
    storeName
  );
};
