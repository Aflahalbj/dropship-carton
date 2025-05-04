
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
          } else {
            // Try to find paired printers and connect to first one
            const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
            if (pairedPrinters.length > 0) {
              console.log("Found paired printers:", pairedPrinters);
              // Try to connect to the first printer silently
              try {
                const connected = await BluetoothPrinterService.connectToPrinter(pairedPrinters[0]);
                if (connected) {
                  console.log("Auto-connected to paired printer:", pairedPrinters[0]);
                  toast.success(`Terhubung otomatis ke printer: ${pairedPrinters[0].name}`, {
                    duration: 3000
                  });
                }
              } catch (error) {
                console.error("Failed to auto-connect to paired printer:", error);
              }
            }
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
      
      // First, try to get paired printers
      const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
      console.log('Found paired printers:', pairedPrinters);
      
      // Use longer scan duration to find more devices
      const scannedPrinters = await BluetoothPrinterService.scanForPrinters(15000);
      console.log('Found new printers from scan:', scannedPrinters);
      
      // Combine paired and scanned printers, avoiding duplicates
      const allPrinters = [...pairedPrinters];
      
      scannedPrinters.forEach(printer => {
        if (!allPrinters.some(p => p.address === printer.address)) {
          allPrinters.push(printer);
        }
      });
      
      console.log('Combined printer list:', allPrinters);
      
      if (allPrinters.length === 0) {
        setShowTroubleshooting(true);
      }
      
      setPrinters(allPrinters);
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
        toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.", {
          duration: 3000
        });
      }
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      toast.error("Gagal terhubung ke printer. Coba restart printer dan aplikasi.", {
        duration: 3000
      });
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
