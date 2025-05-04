
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
  const [initAttempted, setInitAttempted] = useState(false);

  // Periksa untuk printer yang terhubung saat komponen di-mount dengan penanganan error yang lebih baik
  useEffect(() => {
    const checkConnectedDevice = async () => {
      if (isNative) {
        try {
          console.log("Menginisialisasi printer service...");
          const initialized = await BluetoothPrinterService.init();
          setInitAttempted(true);
          
          if (!initialized) {
            console.log("Gagal menginisialisasi printer service");
            return;
          }
          
          const device = BluetoothPrinterService.getConnectedDevice();
          if (device) {
            console.log("Printer sudah terhubung:", device);
            setConnectedPrinter(device);
            
            // Verifikasi koneksi masih aktif
            const isReady = await BluetoothPrinterService.isPrinterReady();
            if (!isReady) {
              console.log("Koneksi printer tidak aktif, mencoba menghubungkan ulang");
              
              // Lakukan beberapa percobaan koneksi
              let reconnected = false;
              for (let i = 0; i < 2; i++) {
                try {
                  reconnected = await BluetoothPrinterService.connectToPrinter(device);
                  if (reconnected) break;
                } catch (error) {
                  console.error(`Percobaan koneksi ulang ${i+1} gagal:`, error);
                }
              }
              
              if (reconnected) {
                console.log("Berhasil terhubung kembali ke printer");
                toast.success(`Terhubung kembali ke printer: ${device.name}`, {
                  duration: 3000
                });
              } else {
                console.log("Gagal menghubungkan kembali ke printer, akan mencoba mencari printer lain");
                setConnectedPrinter(null);
              }
            }
          } else {
            // Coba temukan printer yang sudah dipasangkan dan terhubung ke printer pertama secara diam-diam
            try {
              const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
              if (pairedPrinters.length > 0) {
                console.log("Ditemukan printer yang sudah dipasangkan:", pairedPrinters);
                
                // Coba hubungkan ke printer pertama secara diam-diam
                const connected = await BluetoothPrinterService.connectToPrinter(pairedPrinters[0]);
                
                if (connected) {
                  console.log("Auto-connected to paired printer:", pairedPrinters[0]);
                  setConnectedPrinter(pairedPrinters[0]);
                  toast.success(`Terhubung otomatis ke printer: ${pairedPrinters[0].name}`, {
                    duration: 3000
                  });
                  
                  // Lakukan test print kecil untuk memastikan koneksi
                  try {
                    await BluetoothPrinterService.printText("\n.\n");
                  } catch (printErr) {
                    console.error("Test print error:", printErr);
                    // Tetap anggap terhubung meskipun test gagal
                  }
                } else {
                  console.log("Gagal auto-connect ke paired printer");
                }
              } else {
                console.log("Tidak ada printer yang dipasangkan ditemukan");
              }
            } catch (error) {
              console.error("Gagal auto-connect ke paired printer:", error);
            }
          }
        } catch (error) {
          console.error("Error menginisialisasi printer service:", error);
        }
      } else {
        console.log("Tidak berjalan di platform native, fitur Bluetooth dinonaktifkan");
      }
    };
    
    checkConnectedDevice();
  }, [isNative]);

  const handleScanForPrinters = async () => {
    try {
      setIsScanning(true);
      console.log('Memulai pemindaian printer...');
      
      // Periksa apakah berjalan di platform native
      if (!isNative) {
        toast.error("Fitur Bluetooth hanya tersedia di aplikasi Android/iOS", {
          duration: 3000
        });
        setIsScanning(false);
        return;
      }
      
      // Pertama, coba dapatkan printer yang sudah dipasangkan
      console.log('Memeriksa printer yang sudah dipasangkan...');
      const pairedPrinters = await BluetoothPrinterService.getPairedPrinters();
      console.log('Ditemukan printer yang sudah dipasangkan:', pairedPrinters);
      
      // Lakukan pemindaian dengan durasi lebih lama untuk printer dalam mode pairing
      toast.loading("Memindai printer Bluetooth...", { id: "scanning", duration: 25000 });
      console.log('Memulai pemindaian untuk printer Bluetooth...');
      const scannedPrinters = await BluetoothPrinterService.scanForPrinters(30000); // Durasi pemindaian lebih lama
      toast.dismiss("scanning");
      
      console.log('Ditemukan printer baru dari pemindaian:', scannedPrinters);
      
      // Gabungkan printer yang dipasangkan dan yang dipindai, hindari duplikat
      const allPrinters = [...pairedPrinters];
      
      scannedPrinters.forEach(printer => {
        if (!allPrinters.some(p => p.address === printer.address)) {
          allPrinters.push(printer);
        }
      });
      
      console.log('Daftar gabungan printer:', allPrinters);
      
      if (allPrinters.length === 0) {
        setShowTroubleshooting(true);
        toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing (lampu berkedip) dan Bluetooth aktif.", {
          duration: 5000
        });
      } else {
        toast.success(`${allPrinters.length} printer ditemukan`);
      }
      
      setPrinters(allPrinters);
      setShowPrinterDialog(true);
    } catch (error) {
      console.error("Error memindai printer:", error);
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
      console.log('Menghubungkan ke printer:', printer);
      
      // Beberapa percobaan koneksi untuk hasil yang lebih baik dengan printer dalam mode pairing
      const connected = await BluetoothPrinterService.connectToPrinter(printer);
      
      if (connected) {
        console.log('Berhasil terhubung ke printer');
        setConnectedPrinter(printer);
        toast.success(`Terhubung ke printer: ${printer.name}`, {
          duration: 3000
        });
        setShowPrinterDialog(false);
        setShowTroubleshooting(false);
        
        // Lakukan test print untuk memverifikasi koneksi
        try {
          console.log('Mengirim test print...');
          const testPrintSuccess = await BluetoothPrinterService.printText("Test Print\nKoneksi Berhasil\n\n");
          if (testPrintSuccess) {
            console.log('Test print berhasil');
          } else {
            console.log('Test print gagal tapi koneksi terbentuk');
            toast.warning("Koneksi berhasil tetapi test print gagal. Printer mungkin kehabisan kertas.", {
              duration: 5000
            });
          }
        } catch (printError) {
          console.error('Test print error:', printError);
          // Jangan tampilkan error ke pengguna karena koneksi sudah berhasil
        }
      } else {
        console.log('Gagal terhubung ke printer');
        toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing (lampu berkedip).", {
          duration: 5000
        });
      }
    } catch (error) {
      console.error("Gagal terhubung ke printer:", error);
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
  
  // Warna tombol berubah berdasarkan status koneksi
  const getButtonVariant = () => {
    if (!isNative) return "outline";
    if (connectedPrinter) return "default"; // Tombol hijau ketika terhubung
    return "outline";
  };
  
  // Ikon tombol berdasarkan status
  const getButtonIcon = () => {
    if (isScanning) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    } else if (connectedPrinter) {
      return <Bluetooth className="h-4 w-4 text-white" />;
    } else {
      return <Bluetooth className="h-4 w-4" />;
    }
  };
  
  // Teks tooltip berdasarkan status koneksi
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
