
import React from 'react';
import { Bluetooth, Loader2, AlertCircle, X, Check, HelpCircle, RefreshCcw, WifiOff, Smartphone } from 'lucide-react';
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
  // Panduan pemecahan masalah yang diperluas dengan fokus khusus pada printer EcoPrint
  const troubleshootingTips = [
    {
      title: "Panduan Khusus EcoPrint",
      tips: [
        "Tekan dan tahan tombol POWER pada EcoPrint selama 3-5 detik sampai lampu indikator BERKEDIP BIRU (ini adalah mode pairing yang WAJIB).",
        "Jika lampu menyala HIJAU/BIRU TETAP (tidak berkedip), printer BUKAN dalam mode pairing. Tekan power lebih lama.",
        "Jika lampu menyala MERAH, baterai lemah. Isi daya printer terlebih dahulu.",
        "Pastikan printer memiliki kertas thermal yang terpasang dengan benar.",
        "Untuk model EcoPrint terbaru, nyalakan printer dan tekan tombol power 2x berturut-turut untuk masuk mode pairing.",
        "Jika tidak berhasil, matikan printer, tunggu 10 detik, lalu nyalakan dan coba lagi."
      ]
    },
    {
      title: "Mode Pairing Printer",
      tips: [
        "Mode pairing ditandai dengan lampu indikator yang BERKEDIP CEPAT (bukan menyala tetap).",
        "Pada printer thermal, tombol power biasanya ditekan 3-5 detik sampai lampu berkedip.",
        "JANGAN memasangkan printer melalui pengaturan Bluetooth Android terlebih dahulu, biarkan aplikasi melakukannya.",
        "Jika lampu berkedip lambat, itu bukan mode pairing. Coba tekan tombol lebih lama.",
        "Jika printer sudah terpasang sebelumnya, hapus dari pengaturan Bluetooth Android dan ulangi mode pairing.",
        "Pastikan tidak ada perangkat lain yang terhubung ke printer saat melakukan pairing."
      ]
    },
    {
      title: "Printer Tidak Terdeteksi",
      tips: [
        "Pastikan printer berada maksimal 1 meter dari HP saat proses pairing pertama kali.",
        "Pastikan printer dinyalakan dan baterai dalam kondisi baik (tidak menyala merah).",
        "Matikan dan nyalakan Bluetooth di perangkat Android.",
        "Restart printer dengan mematikan dan menyalakan kembali.",
        "Buka pengaturan Bluetooth di Android, hapus pasangan printer yang sudah ada (jika ada).",
        "Hapus data dan cache aplikasi, lalu buka kembali aplikasi.",
        "Jika semua gagal, restart perangkat Android Anda dan coba lagi."
      ]
    },
    {
      title: "Masalah Koneksi Khusus",
      tips: [
        "Untuk printer EcoPrint: saat berhasil terpasang, lampu biru akan berhenti berkedip. Tunggu prosesnya selesai.",
        "Coba sambungkan ke HP lain untuk memastikan printer berfungsi dengan normal.",
        "Untuk printer yang sulit terdeteksi, coba gunakan aplikasi 'Bluetooth Scanner' untuk melihat apakah perangkat terlihat.",
        "Periksa apakah printer mendukung protokol ESC/POS atau CPCL (untuk printer thermal).",
        "Matikan mode hemat baterai di HP Anda karena dapat membatasi koneksi Bluetooth.",
        "Jika printer terdeteksi tapi gagal mencetak, cek apakah kertas dipasang dengan benar dan tidak macet."
      ]
    },
    {
      title: "Izin yang Dibutuhkan",
      tips: [
        "Izin Lokasi (WAJIB untuk memindai Bluetooth pada Android)",
        "Izin Bluetooth dan Bluetooth Admin",
        "Izin Bluetooth Scan dan Bluetooth Connect",
        "Buka pengaturan aplikasi > Izin dan pastikan SEMUA izin diberikan.",
        "Aktifkan semua izin Lokasi (Latar Belakang dan Saat Aplikasi Digunakan)",
        "Jika diminta, izinkan aplikasi untuk mengaktifkan Bluetooth secara otomatis."
      ]
    },
    {
      title: "Langkah Terakhir",
      tips: [
        "Jika semua langkah gagal, coba sambungkan printer ke aplikasi lain (misalnya: Bluetooth Print Service)",
        "Setelah berhasil tersambung di aplikasi lain, tutup aplikasi tersebut dan buka aplikasi ini kembali.",
        "Factory reset printer dengan menekan tombol power dan feed bersamaan selama 10 detik (jika ada).",
        "Jika printer sama sekali tidak terdeteksi oleh perangkat manapun, printer mungkin rusak atau tidak kompatibel."
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Perangkat Printer Bluetooth</DialogTitle>
          <DialogDescription>
            Pilih printer thermal yang ingin dihubungkan
          </DialogDescription>
        </DialogHeader>
        
        {/* Status printer yang terhubung */}
        {connectedPrinter && (
          <Alert className="mb-4 bg-green-50 border-green-500">
            <Check className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Printer Terhubung</AlertTitle>
            <AlertDescription className="text-green-600">
              {connectedPrinter.name} sudah terhubung dan siap digunakan
            </AlertDescription>
          </Alert>
        )}
        
        {/* Instruksi mode pairing yang ditingkatkan */}
        {isScanning ? (
          <Alert className="mb-4 bg-blue-50 border-blue-300">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertTitle className="text-blue-700">Memindai Printer...</AlertTitle>
            <AlertDescription className="text-blue-600">
              <div className="space-y-2">
                <p><strong>Pastikan printer dalam mode PAIRING:</strong></p>
                <p>1. Tekan tombol POWER selama 3-5 detik sampai lampu BERKEDIP BIRU</p>
                <p>2. Dekatkan printer dengan HP (jarak &lt;1 meter)</p>
                <p>3. Tunggu hingga pemindaian selesai</p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4 bg-blue-50 border-blue-300">
            <Smartphone className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-700">Pindai Printer</AlertTitle>
            <AlertDescription className="text-blue-600">
              Klik tombol "Pindai Ulang" di bawah untuk mencari printer Bluetooth
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
                  <span className="font-medium">{printer.name || "Printer Tanpa Nama"}</span>
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
                <p>Tidak ada printer terdeteksi. Pastikan langkah-langkah berikut:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>Printer dinyalakan dan dalam MODE PAIRING (lampu BERKEDIP BIRU)</li>
                  <li>Bluetooth perangkat Anda aktif</li>
                  <li>Printer berada dekat dengan perangkat (&lt;1 meter)</li>
                  <li>Baterai printer tidak lemah (lampu bukan merah)</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {showTroubleshooting && (
          <div className="mt-4 border rounded-lg p-3 bg-muted/50">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <HelpCircle className="h-4 w-4 mr-1" />
              Panduan Pemecahan Masalah Printer
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
