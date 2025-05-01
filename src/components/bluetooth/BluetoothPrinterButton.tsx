
import React, { useState } from 'react';
import { Bluetooth, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import BluetoothPrinterDialog from './BluetoothPrinterDialog';
import { toast } from "sonner";
import BluetoothPrinterService, { PrinterDevice } from "@/services/BluetoothPrinterService";
import { Capacitor } from '@capacitor/core';

interface BluetoothPrinterButtonProps {
  className?: string;
}

const BluetoothPrinterButton: React.FC<BluetoothPrinterButtonProps> = ({ className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const isNative = Capacitor.isNativePlatform();

  const handleScanForPrinters = async () => {
    try {
      setIsScanning(true);
      console.log('Starting printer scan...');
      
      // Check if running on native platform
      if (!isNative) {
        toast.error("Fitur Bluetooth hanya tersedia di aplikasi Android/iOS", {
          duration: 3000
        });
        setIsScanning(false);
        return;
      }
      
      const foundPrinters = await BluetoothPrinterService.scanForPrinters();
      console.log('Found printers:', foundPrinters);
      
      if (foundPrinters.length === 0) {
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan.", {
          duration: 3000
        });
        return;
      }
      
      setPrinters(foundPrinters);
      setShowPrinterDialog(true);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      toast.error("Gagal mencari printer. Pastikan Bluetooth diaktifkan.", {
        duration: 3000
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      setConnecting(printer.id);
      console.log('Connecting to printer:', printer);
      const connected = await BluetoothPrinterService.connectToPrinter(printer);
      
      if (connected) {
        console.log('Successfully connected to printer');
        toast.success(`Terhubung ke printer: ${printer.name}`, {
          duration: 3000
        });
        setShowPrinterDialog(false);
      } else {
        console.log('Failed to connect to printer');
        toast.error(`Gagal terhubung ke printer: ${printer.name}`, {
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      toast.error(`Gagal terhubung ke printer: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        duration: 3000
      });
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
      
      <BluetoothPrinterDialog 
        open={showPrinterDialog} 
        onOpenChange={setShowPrinterDialog}
        printers={printers}
        connecting={connecting}
        onConnectPrinter={connectToPrinter}
        onRescan={handleScanForPrinters}
        isScanning={isScanning}
      />
    </>
  );
};

export default BluetoothPrinterButton;
