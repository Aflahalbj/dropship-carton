
import React from 'react';
import { Bluetooth, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrinterDevice } from "@/services/BluetoothPrinterService";

interface BluetoothPrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printers: PrinterDevice[];
  connecting: string | null;
  onConnectPrinter: (printer: PrinterDevice) => Promise<void>;
  onRescan: () => Promise<void>;
  isScanning: boolean;
}

const BluetoothPrinterDialog: React.FC<BluetoothPrinterDialogProps> = ({
  open,
  onOpenChange,
  printers,
  connecting,
  onConnectPrinter,
  onRescan,
  isScanning
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              </Button>
            ))
          ) : (
            <p className="text-center py-4 text-gray-500">Tidak ada printer yang ditemukan</p>
          )}
        </div>
        
        <Button 
          className="w-full mt-2" 
          onClick={onRescan}
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
  );
};

export default BluetoothPrinterDialog;
