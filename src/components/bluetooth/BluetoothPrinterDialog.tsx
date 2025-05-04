
import React from 'react';
import { Bluetooth, Loader2, AlertCircle, X, Check, HelpCircle, RefreshCcw, WifiOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PrinterDevice } from "@/services/BluetoothPrinterService";
import { Badge } from "@/components/ui/badge";

interface BluetoothPrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printers: PrinterDevice[];
  connecting: string | null;
  onConnectPrinter: (printer: PrinterDevice) => Promise<void>;
  onRescan: () => Promise<void>;
  isScanning: boolean;
  showTroubleshooting?: boolean;
  onToggleTroubleshooting?: () => void;
  connectedPrinter: PrinterDevice | null;
}

const BluetoothPrinterDialog: React.FC<BluetoothPrinterDialogProps> = ({
  open,
  onOpenChange,
  printers,
  connecting,
  onConnectPrinter,
  onRescan,
  isScanning,
  showTroubleshooting = false,
  onToggleTroubleshooting,
  connectedPrinter,
}) => {
  // Enhanced troubleshooting tips with more detailed EcoPrint instructions and pairing mode guidance
  const troubleshootingTips = [
    {
      title: "EcoPrint & Printer Thermal Lainnya",
      tips: [
        "Tekan dan tahan tombol power pada EcoPrint selama 3-5 detik hingga lampu indikator berkedip BIRU untuk mode pairing.",
        "Jika lampu masih menyala merah, berarti printer belum dalam mode pairing. Coba tekan tombol power lebih lama.",
        "Pastikan printer sudah terisi daya atau baterai penuh (lampu indikator harus biru atau hijau, bukan merah).",
        "Pastikan printer sudah memiliki kertas thermal yang terpasang dengan benar.",
        "Jika printer tidak terdeteksi, reset printer dengan menekan tombol reset (biasanya di bagian bawah) atau power selama 8-10 detik.",
        "Untuk model EcoPrint terbaru, pastikan lampu indikator berkedip cepat (mode pairing) sebelum menghubungkan."
      ]
    },
    {
      title: "Mode Pairing Printer",
      tips: [
        "Pastikan printer dalam mode pairing sebelum memindai (biasanya lampu indikator berkedip cepat).",
        "Pada sebagian besar printer thermal, tombol power ditekan 3-5 detik sampai lampu berkedip.",
        "Jangan melakukan pairing di pengaturan Bluetooth Android terlebih dahulu, biarkan aplikasi yang melakukannya.",
        "Untuk beberapa printer, jika lampu berkedip lambat, itu bukan mode pairing. Coba tekan tombol lebih lama.",
        "Jika printer sudah terpasang sebelumnya, hapus dari pengaturan Bluetooth Android dan ulangi mode pairing.",
        "Pastikan tidak ada perangkat lain yang sedang terhubung ke printer saat melakukan pairing."
      ]
    },
    {
      title: "Printer Tidak Terdeteksi",
      tips: [
        "Pastikan printer dalam mode pairing (lampu indikator berkedip).",
        "Pastikan printer dinyalakan dan baterai dalam kondisi baik.",
        "Pastikan printer berada dalam jangkauan Bluetooth (biasanya 5-10 meter).",
        "Matikan dan nyalakan kembali Bluetooth di perangkat Android.",
        "Coba matikan dan nyalakan kembali printer.",
        "Buka pengaturan Bluetooth di Android, hapus pasangan printer yang sudah ada (jika ada).",
        "Jika semua gagal, restart perangkat Android Anda dan coba lagi."
      ]
    },
    {
      title: "Masalah Koneksi",
      tips: [
        "Pastikan tidak ada perangkat lain yang terhubung dengan printer.",
        "Coba hapus pairing yang ada di pengaturan Bluetooth Android.",
        "Restart perangkat Android Anda dan coba lagi.",
        "Pastikan Android Anda versi 6.0 atau lebih tinggi.",
        "Periksa kertas printer dan pastikan sudah terpasang dengan benar.",
        "Untuk printer EcoPrint, tunggu sampai lampu indikator biru berhenti berkedip setelah terhubung.",
        "Jika koneksi berulang kali gagal, buka pengaturan Bluetooth Android, aktifkan visibilitas perangkat Anda selama 2 menit."
      ]
    },
    {
      title: "Izin yang Dibutuhkan",
      tips: [
        "Izin Lokasi (diperlukan untuk memindai Bluetooth pada Android)",
        "Izin Bluetooth",
        "Izin Bluetooth Admin",
        "Izin Bluetooth Scan",
        "Izin Bluetooth Connect",
        "Buka pengaturan aplikasi > Izin dan pastikan semua izin diberikan.",
        "Jika diminta, izinkan aplikasi untuk mengaktifkan Bluetooth secara otomatis."
      ]
    },
    {
      title: "Jika Terus Gagal",
      tips: [
        "Cobalah menghubungkan printer dengan aplikasi Bluetooth printer scanner lain terlebih dahulu, lalu kembali ke aplikasi ini.",
        "Matikan fitur hemat daya atau mode baterai pada perangkat Android Anda.",
        "Jika printer sudah terhubung ke sistem Android (terlihat di menu Bluetooth), coba lepaskan pasangan dan hubungkan ulang.",
        "Reset semua pengaturan Bluetooth dengan mematikan Bluetooth, restart perangkat, lalu hidupkan kembali Bluetooth.",
        "Pastikan printer kompatibel dengan ESC/POS commands (untuk printer thermal).",
        "Coba sambungkan ke HP lain untuk memastikan printer berfungsi dengan normal."
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perangkat Printer Bluetooth</DialogTitle>
          <DialogDescription>
            Pilih printer yang ingin dihubungkan
          </DialogDescription>
        </DialogHeader>
        
        {/* Show connected printer status if any */}
        {connectedPrinter && (
          <Alert className="mb-4 bg-green-50 border-green-500">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Printer Terhubung</AlertTitle>
            <AlertDescription className="text-green-600">
              {connectedPrinter.name} sudah terhubung dan siap digunakan
            </AlertDescription>
          </Alert>
        )}
        
        {/* Enhanced scan information with pairing mode instructions */}
        {isScanning && (
          <Alert className="mb-4 bg-blue-50 border-blue-300">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertTitle className="text-blue-700">Memindai...</AlertTitle>
            <AlertDescription className="text-blue-600">
              Pastikan printer dalam mode pairing (tombol power ditekan 3-5 detik hingga lampu berkedip)
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {printers.length > 0 ? (
            printers.map((printer) => (
              <Button
                key={printer.id}
                variant={connectedPrinter?.id === printer.id ? "default" : "outline"}
                className={`w-full justify-start text-left h-auto py-3 relative ${connectedPrinter?.id === printer.id ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
                onClick={() => onConnectPrinter(printer)}
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
                {connectedPrinter?.id === printer.id && (
                  <Badge className="absolute right-2 bg-white text-green-600 border-green-600">
                    <Check className="mr-1 h-3 w-3" /> Terhubung
                  </Badge>
                )}
              </Button>
            ))
          ) : (
            <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Printer tidak ditemukan</AlertTitle>
              <AlertDescription>
                Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing. 
                Untuk printer EcoPrint, tekan tombol power selama 3-5 detik hingga lampu indikator berkedip BIRU.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {showTroubleshooting && (
          <div className="mt-4 border rounded-lg p-3 bg-muted/50">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" />
              Panduan Pemecahan Masalah
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {troubleshootingTips.map((section, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-sm font-medium">{section.title}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {section.tips.map((tip, tipIndex) => (
                        <li key={tipIndex}>{tip}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
        
        <DialogFooter className="flex sm:justify-between mt-4 flex-col sm:flex-row gap-2">
          <Button 
            className="w-full" 
            onClick={onRescan}
            disabled={isScanning}
            variant="default"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memindai...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Pindai Ulang
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={onToggleTroubleshooting}
          >
            {showTroubleshooting ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Sembunyikan Bantuan
              </>
            ) : (
              <>
                <HelpCircle className="mr-2 h-4 w-4" />
                Lihat Bantuan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BluetoothPrinterDialog;
