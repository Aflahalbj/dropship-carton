
import { Capacitor } from '@capacitor/core';
import { BluetoothPrinter } from 'capacitor-bluetooth-printer';
import { toast } from 'sonner';
import '../utils/capacitorShim'; // Import our shim to ensure compatibility

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

class BluetoothPrinterServiceClass {
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized = false;

  constructor() {
    console.info('BluetoothPrinterService initialized:', {
      isNativeApp: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform()
    });
  }

  async init(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Bluetooth printing only works on native platforms');
        return false;
      }
      
      const result = await BluetoothPrinter.initialize();
      this.isInitialized = result.value;
      console.log('Bluetooth printer initialized:', result);
      return result.value;
    } catch (error) {
      console.error('Failed to initialize Bluetooth printer:', error);
      return false;
    }
  }

  async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      await this.init();
      console.log('Scanning for Bluetooth printers...');
      
      const result = await BluetoothPrinter.scan({
        scanDuration: 5000  // 5 seconds scan
      });
      
      if (!result.value) {
        console.log('No printers found or scan failed');
        return [];
      }
      
      const devices: PrinterDevice[] = Array.isArray(result.devices) ? result.devices.map(device => ({
        id: device.address,
        name: device.name || 'Unknown Device',
        address: device.address
      })) : [];
      
      console.log('Found printers:', devices);
      return devices;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw error;
    }
  }

  async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    try {
      await this.init();
      console.log('Connecting to printer:', printer);
      
      const result = await BluetoothPrinter.connect({
        address: printer.address
      });
      
      if (result.value) {
        this.connectedDevice = printer;
        console.log('Successfully connected to printer');
        return true;
      } else {
        console.log('Failed to connect to printer');
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      throw error;
    }
  }

  async printText(text: string): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        console.log('No printer connected');
        return false;
      }
      
      await this.init();
      console.log('Printing text:', text.substring(0, 50) + '...');
      
      const result = await BluetoothPrinter.print({
        text: text
      });
      
      return result.value;
    } catch (error) {
      console.error('Failed to print:', error);
      throw error;
    }
  }

  getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }

  async disconnect(): Promise<boolean> {
    try {
      if (!this.connectedDevice) return true;
      
      await this.init();
      const result = await BluetoothPrinter.disconnect();
      
      if (result.value) {
        this.connectedDevice = null;
      }
      
      return result.value;
    } catch (error) {
      console.error('Failed to disconnect from printer:', error);
      throw error;
    }
  }
}

const BluetoothPrinterService = new BluetoothPrinterServiceClass();
export default BluetoothPrinterService;
