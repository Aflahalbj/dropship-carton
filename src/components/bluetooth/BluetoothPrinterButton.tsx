
import React, { useState, useEffect } from 'react';
import { Bluetooth, Loader2, AlertCircle } from 'lucide-react';
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
  const [connectedPrinter, setConnectedPrinter] = useState<PrinterDevice | null>(null);
  const isNative = Capacitor.isNativePlatform();

  // Check for connected printer on component mount with improved error handling
  useEffect(() => {
    const checkConnectedDevice = async () => {
      if (isNative) {
        try {
          console.log("Initializing printer service...");
          await BluetoothPrinterService.init();
          const device = BluetoothPrinterService.getConnectedDevice();
          if (device) {
            console.log("Already connected to printer:", device);
            setConnectedPrinter(device);
            
            // Verify the connection is still active
            const isReady = await BluetoothPrinterService.isPrinterReady();
            if (!isReady) {
              console.log("Printer connection not active, attempting to reconnect");
              const reconnected = await BluetoothPrinterService.connectToPrinter(device);
              if (reconnected) {
                console.log("Successfully reconnected to printer");
                toast.success(`Terhubung kembali ke printer: ${device.name}`, {
                  duration: 3000
                });
              } else {
                console.log("Failed to reconnect to printer, will try to find other printers");
                setConnectedPrinter(null);
              }
            }
          } else {
            // Try to find paired printers and connect to first one silently
            const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
            if (pairedPrinters.length > 0) {
              console.log("Found paired printers:", pairedPrinters);
              // Try to connect to the first printer silently
              try {
                toast.loading("Menghubungkan ke printer yang tersedia...", { id: "auto-connect", duration: 5000 });
                const connected = await BluetoothPrinterService.connectToPrinter(pairedPrinters[0]);
                toast.dismiss("auto-connect");
                
                if (connected) {
                  console.log("Auto-connected to paired printer:", pairedPrinters[0]);
                  setConnectedPrinter(pairedPrinters[0]);
                  toast.success(`Terhubung otomatis ke printer: ${pairedPrinters[0].name}`, {
                    duration: 3000
                  });
                } else {
                  console.log("Failed to auto-connect to paired printer, will show printer selection when needed");
                }
              } catch (error) {
                toast.dismiss("auto-connect");
                console.error("Failed to auto-connect to paired printer:", error);
              }
            } else {
              console.log("No paired printers found, will scan when user initiates printing");
            }
          }
        } catch (error) {
          console.error("Error initializing printer service:", error);
        }
      } else {
        console.log("Not running on native platform, Bluetooth functionality disabled");
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
      
      // First, try to get paired printers with improved logging
      console.log('Checking for paired printers...');
      const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
      console.log('Found paired printers:', pairedPrinters);
      
      // Use longer scan duration to better detect printers in pairing mode
      toast.loading("Memindai printer Bluetooth...", { id: "scanning", duration: 25000 });
      console.log('Starting extended scan for Bluetooth printers...');
      const scannedPrinters = await BluetoothPrinterService.scanForPrinters(25000); // Extended scan duration
      toast.dismiss("scanning");
      
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
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing dan Bluetooth aktif.", {
          duration: 5000
        });
      } else {
        toast.success(`${allPrinters.length} printer ditemukan`);
      }
      
      setPrinters(allPrinters);
      setShowPrinterDialog(true);
    } catch (error) {
      console.error("Error scanning for printers:", error);
      toast.error("Gagal mencari printer. Pastikan Bluetooth diaktifkan dan izin lokasi diberikan.", {
        duration: 5000
      });
    } finally {
      setIsScanning(false);
    }
  };
  
  const connectToPrinter = async (printer: PrinterDevice) => {
    try {
      setConnecting(printer.id);
      console.log('Connecting to printer:', printer);
      
      // Multiple connection attempts for better success with printers in pairing mode
      const connected = await BluetoothPrinterService.connectToPrinter(printer);
      
      if (connected) {
        console.log('Successfully connected to printer');
        setConnectedPrinter(printer);
        toast.success(`Terhubung ke printer: ${printer.name}`, {
          duration: 3000
        });
        setShowPrinterDialog(false);
        setShowTroubleshooting(false);
        
        // Attempt a test print to verify the connection
        try {
          console.log('Sending test print...');
          const testPrintSuccess = await BluetoothPrinterService.printText("Test Print\nKoneksi Berhasil\n\n");
          if (testPrintSuccess) {
            console.log('Test print successful');
          } else {
            console.log('Test print failed but connection was established');
            toast.warning("Koneksi berhasil tetapi test print gagal. Printer mungkin kehabisan kertas atau belum siap.", {
              duration: 5000
            });
          }
        } catch (printError) {
          console.error('Test print error:', printError);
          // Don't show error to user since the connection was successful
        }
      } else {
        console.log('Failed to connect to printer');
        toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.", {
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Failed to connect to printer:", error);
      toast.error("Gagal terhubung ke printer. Coba restart printer dan aplikasi.", {
        duration: 5000
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
  
  // Button color changes based on connection status
  const getButtonVariant = () => {
    if (!isNative) return "outline";
    if (connectedPrinter) return "default"; // Green button when connected
    return "outline";
  };
  
  // Button icon based on state
  const getButtonIcon = () => {
    if (isScanning) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    } else if (connectedPrinter) {
      return <Bluetooth className="h-4 w-4 text-white" />;
    } else {
      return <Bluetooth className="h-4 w-4" />;
    }
  };
  
  // Tooltip text based on connection status
  const getTooltipText = () => {
    if (!isNative) return "Bluetooth printer hanya tersedia di aplikasi Android/iOS";
    if (connectedPrinter) return `Terhubung ke printer: ${connectedPrinter.name}`;
    return "Hubungkan ke printer Bluetooth";
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={getButtonVariant()} 
              size="icon" 
              className={`aspect-square w-12 h-12 rounded-lg ${connectedPrinter ? 'bg-green-500 hover:bg-green-600' : 'bg-slate-50 border border-gray-300'} ${className}`}
              onClick={handleScanForPrinters}
              disabled={isScanning}
            >
              {getButtonIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
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
        connectedPrinter={connectedPrinter}
      />
    </>
  );
};

export default BluetoothPrinterButton;
