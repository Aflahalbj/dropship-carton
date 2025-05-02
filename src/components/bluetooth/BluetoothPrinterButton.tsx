
import React, { useState, useEffect } from 'react';
import { Bluetooth, Loader2, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import BluetoothPrinterDialog from './BluetoothPrinterDialog';
import { toast } from "sonner";
import BluetoothPrinterService, { PrinterDevice } from "@/services/BluetoothPrinterService";
import { Capacitor } from '@capacitor/core';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BluetoothPrinterButtonProps {
  className?: string;
}

const BluetoothPrinterButton: React.FC<BluetoothPrinterButtonProps> = ({ className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [showPrinterDialog, setShowPrinterDialog] = useState(false);
  const [printers, setPrinters] = useState<PrinterDevice[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  // Check for connected printer on component mount
  useEffect(() => {
    const checkConnectedDevice = async () => {
      if (isNative) {
        try {
          await BluetoothPrinterService.init();
          const device = BluetoothPrinterService.getConnectedDevice();
          if (device) {
            console.log("Already connected to printer:", device);
          }
        } catch (error) {
          console.error("Error initializing printer service:", error);
        }
      }
    };
    
    checkConnectedDevice();
  }, [isNative]);

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
      
      // Use longer scan duration to find more devices
      const foundPrinters = await BluetoothPrinterService.scanForPrinters(20000);
      console.log('Found printers:', foundPrinters);
      
      if (foundPrinters.length === 0) {
        setShowTroubleshooting(true);
      }
      
      setPrinters(foundPrinters);
      setShowPrinterDialog(true);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      toast.error("Gagal mencari printer. Pastikan Bluetooth diaktifkan dan izin lokasi diberikan.", {
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
        setShowTroubleshooting(false);
      } else {
        console.log('Failed to connect to printer');
      }
    } catch (error) {
      console.error("Failed to connect to printer:", error);
    } finally {
      setConnecting(null);
    }
  };

  const handleCancelScan = () => {
    if (isScanning) {
      BluetoothPrinterService.cancelScan();
      setIsScanning(false);
      toast.info("Pemindaian dibatalkan", { duration: 2000 });
    }
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Hubungkan ke printer Bluetooth</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <BluetoothPrinterDialog 
        open={showPrinterDialog} 
        onOpenChange={(open) => {
          setShowPrinterDialog(open);
          if (!open && isScanning) {
            handleCancelScan();
          }
        }}
        printers={printers}
        connecting={connecting}
        onConnectPrinter={connectToPrinter}
        onRescan={handleScanForPrinters}
        isScanning={isScanning}
        showTroubleshooting={showTroubleshooting}
        onToggleTroubleshooting={() => setShowTroubleshooting(!showTroubleshooting)}
      />
    </>
  );
};

export default BluetoothPrinterButton;
