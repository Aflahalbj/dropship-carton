import { toast } from "sonner";
import { CartItem } from '../context/types';
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import { Capacitor } from '@capacitor/core';

// ESC/POS commands for 58mm thermal printers
const ESC = 0x1B;
const GS = 0x1D;

// 58mm thermal printer typically supports 32 characters per line (font A)
const CHARS_PER_LINE = 32;

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

export class BluetoothPrinterService {
  private static instance: BluetoothPrinterService;
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized = false;
  private isNativeApp = false;

  private constructor() {
    // Check if we're in a native environment (Capacitor)
    this.isNativeApp = Capacitor.isNativePlatform();
    
    console.log('BluetoothPrinterService initialized:', {
      isNativeApp: this.isNativeApp,
      platform: Capacitor.getPlatform()
    });
  }

  public static getInstance(): BluetoothPrinterService {
    if (!BluetoothPrinterService.instance) {
      BluetoothPrinterService.instance = new BluetoothPrinterService();
    }
    return BluetoothPrinterService.instance;
  }

  public async initialize(): Promise<boolean> {
    try {
      if (!this.isNativeApp) {
        console.warn('Bluetooth features are only available in native apps');
        return false;
      }
      
      console.log('Initializing Bluetooth services...');
      
      if (!this.isInitialized) {
        // Try to initialize BleClient first
        try {
          console.log('Attempting to initialize BleClient...');
          await BleClient.initialize({ androidNeverForLocation: false });
          console.log('BleClient initialized successfully');
          this.isInitialized = true;
        } catch (bleError) {
          console.error('Failed to initialize BleClient:', bleError);
          // Fall back to BluetoothSerial
          try {
            console.log('Checking if BluetoothSerial is available...');
            if (BluetoothSerial) {
              console.log('Checking if Bluetooth is enabled...');
              const isEnabled = await BluetoothSerial.isEnabled();
              console.log('BluetoothSerial enabled:', isEnabled);
              if (!isEnabled) {
                console.log('Enabling BluetoothSerial...');
                await BluetoothSerial.enable();
                console.log('BluetoothSerial enabled successfully');
              }
              this.isInitialized = true;
            }
          } catch (serialError) {
            console.error('Failed to initialize BluetoothSerial:', serialError);
          }
        }
      }
      
      return this.isInitialized;
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      return false;
    }
  }

  public async scanForPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!this.isNativeApp) {
        toast.warning('Bluetooth tidak tersedia di browser. Gunakan aplikasi Android untuk fitur ini.');
        return [];
      }
      
      const initialized = await this.initialize();
      console.log('Bluetooth initialized:', initialized);
      
      if (!initialized) {
        toast.error('Gagal menginisialisasi Bluetooth. Pastikan Bluetooth diaktifkan.');
        return [];
      }
      
      let pairedPrinters: PrinterDevice[] = [];
      
      // Try to get paired devices from BluetoothSerial first
      try {
        if (BluetoothSerial && BluetoothSerial.list) {
          console.log('Getting paired devices from BluetoothSerial...');
          const pairedDevices = await BluetoothSerial.list();
          console.log('Paired devices from BluetoothSerial:', pairedDevices);
          
          if (Array.isArray(pairedDevices)) {
            pairedPrinters = pairedDevices.map(device => ({
              id: device.id || device.address,
              name: device.name || 'Unknown Device',
              address: device.address
            }));
          }
        }
      } catch (serialError) {
        console.error('Error getting paired devices from BluetoothSerial:', serialError);
      }
      
      // If BluetoothSerial didn't return any devices, try BleClient
      if (pairedPrinters.length === 0) {
        try {
          if (BleClient) {
            console.log('Starting BLE scan for devices...');
            await BleClient.requestLEScan({}, scanResult => {
              if (scanResult.device && scanResult.device.deviceId && scanResult.device.name) {
                // Check if the device is already in our list
                const exists = pairedPrinters.some(p => p.id === scanResult.device.deviceId);
                if (!exists) {
                  pairedPrinters.push({
                    id: scanResult.device.deviceId,
                    name: scanResult.device.name || 'Unknown BLE Device',
                    address: scanResult.device.deviceId
                  });
                }
              }
            });
            
            // Scan for a few seconds
            await new Promise(resolve => setTimeout(resolve, 3000));
            await BleClient.stopLEScan();
            console.log('BLE scan completed, found devices:', pairedPrinters);
          }
        } catch (bleError) {
          console.error('Error scanning with BleClient:', bleError);
        }
      }
      
      return pairedPrinters;
    } catch (error) {
      console.error('Failed to scan for printers:', error);
      toast.error('Gagal memindai printer. Pastikan Bluetooth diaktifkan.');
      return [];
    }
  }

  public async connectToPrinter(device: PrinterDevice): Promise<boolean> {
    try {
      if (!this.isNativeApp) {
        toast.error('Bluetooth tidak tersedia di browser');
        return false;
      }
      
      console.log('Connecting to printer:', device);
      
      // Disconnect any existing connection first
      await this.disconnect();
      
      // Try connecting using BluetoothSerial first
      try {
        if (BluetoothSerial && BluetoothSerial.connect) {
          console.log(`Attempting to connect to ${device.name} (${device.address}) with BluetoothSerial`);
          await BluetoothSerial.connect(device.address);
          console.log('Connection successful with BluetoothSerial');
          this.connectedDevice = device;
          toast.success(`Terhubung ke printer: ${device.name}`);
          return true;
        }
      } catch (serialError) {
        console.error('Failed to connect with BluetoothSerial:', serialError);
      }
      
      // If BluetoothSerial fails, try BleClient
      try {
        if (BleClient) {
          console.log(`Attempting to connect to ${device.name} (${device.id}) with BleClient`);
          await BleClient.connect(device.id);
          console.log('Connection successful with BleClient');
          this.connectedDevice = device;
          toast.success(`Terhubung ke printer: ${device.name}`);
          return true;
        }
      } catch (bleError) {
        console.error('Failed to connect with BleClient:', bleError);
      }
      
      toast.error(`Gagal terhubung ke printer: ${device.name}`);
      return false;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.error(`Gagal terhubung ke printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  public async printReceipt(
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerName: string | undefined,
    cashAmount: number | undefined,
    changeAmount: number | undefined,
    transactionId: string,
    date: Date,
    storeName: string = 'TOKO ABDULLAH',
    storeLocation: string = 'TANGERANG',
    storePhone: string = '083880863610'
  ): Promise<boolean> {
    try {
      console.log('Print receipt requested with parameters:', {
        items,
        total,
        paymentMethod,
        customerName,
        cashAmount,
        changeAmount,
        transactionId,
        date,
        storeName,
        storeLocation,
        storePhone
      });
      
      if (!this.isNativeApp) {
        toast.error('Fitur cetak hanya tersedia di aplikasi Android');
        return false;
      }
      
      if (!this.connectedDevice) {
        toast.error('Tidak ada printer yang terhubung');
        return false;
      }
      
      // Enhanced logging
      console.log('Printing with connected device:', this.connectedDevice);
      
      // Try different printing methods
      const methods = [
        this.printWithBluetoothSerial.bind(this),
        this.printWithBleClient.bind(this)
      ];
      
      for (const method of methods) {
        try {
          const success = await method(
            items,
            total,
            paymentMethod,
            customerName,
            cashAmount,
            changeAmount,
            transactionId,
            date,
            storeName,
            storeLocation,
            storePhone
          );
          
          if (success) {
            toast.success('Struk berhasil dicetak!');
            return true;
          }
        } catch (error) {
          console.error(`Printing method failed:`, error);
          // Continue to next method
        }
      }
      
      toast.error('Semua metode pencetakan gagal. Periksa koneksi printer.');
      return false;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      toast.error(`Gagal mencetak struk: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  private async printWithBluetoothSerial(
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerName: string | undefined,
    cashAmount: number | undefined,
    changeAmount: number | undefined,
    transactionId: string,
    date: Date,
    storeName: string,
    storeLocation: string,
    storePhone: string
  ): Promise<boolean> {
    if (!BluetoothSerial || !BluetoothSerial.write) {
      console.log('BluetoothSerial.write not available');
      return false;
    }
    
    console.log('Attempting to print with BluetoothSerial...');
    
    try {
      // Try to reconnect if connection was lost
      if (BluetoothSerial.isConnected) {
        const isConnected = await BluetoothSerial.isConnected();
        if (!isConnected && this.connectedDevice) {
          console.log('Reconnecting to device...');
          await BluetoothSerial.connect(this.connectedDevice.address);
        }
      }
      
      // Initialize printer
      const commands = [];
      
      // Reset printer to defaults
      commands.push(new Uint8Array([ESC, 0x40])); // ESC @
      
      // Set character size - normal
      commands.push(new Uint8Array([ESC, 0x21, 0x00])); // ESC ! 0
      
      // Center align
      commands.push(new Uint8Array([ESC, 0x61, 0x01])); // ESC a 1
      
      // Bold on for header
      commands.push(new Uint8Array([ESC, 0x45, 0x01])); // ESC E 1
      
      // Store info
      commands.push(this.textToBytes(`${storeName}\n`));
      commands.push(this.textToBytes(`${storeLocation}\n`));
      commands.push(this.textToBytes(`${storePhone}\n\n`));
      
      // Bold off
      commands.push(new Uint8Array([ESC, 0x45, 0x00])); // ESC E 0
      
      // Left align
      commands.push(new Uint8Array([ESC, 0x61, 0x00])); // ESC a 0
      
      // Customer
      if (customerName) {
        commands.push(this.textToBytes(`Tuan/Bos: ${customerName}\n`));
      }
      
      commands.push(this.textToBytes(`--------------------------------\n`));
      
      // Transaction info
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      commands.push(this.textToBytes(`No - ${transactionId.slice(-4)}  ${formattedTime}  ${formattedDate}\n`));
      commands.push(this.textToBytes(`--------------------------------\n\n`));
      
      // Items
      items.forEach(item => {
        commands.push(this.textToBytes(`${item.product.name}\n`));
        const qtyPrice = `${item.quantity} x ${item.product.price.toLocaleString('id-ID')}`;
        const total = `Rp ${(item.product.price * item.quantity).toLocaleString('id-ID')}`;
        commands.push(this.textToBytes(`${qtyPrice}\n`));
        commands.push(this.textToBytes(`${total}\n\n`));
      });
      
      commands.push(this.textToBytes(`--------------------------------\n`));
      
      // Totals
      commands.push(this.textToBytes(`Total                Rp ${total.toLocaleString('id-ID')}\n`));
      commands.push(this.textToBytes(`Bayar (${paymentMethod === 'cash' ? 'Cash' : 'Transfer'})\n`));
      commands.push(this.textToBytes(`                     Rp ${(cashAmount || total).toLocaleString('id-ID')}\n`));
      commands.push(this.textToBytes(`Kembali              Rp ${(changeAmount || 0).toLocaleString('id-ID')}\n\n`));
      
      // Center align for thank you
      commands.push(new Uint8Array([ESC, 0x61, 0x01])); // ESC a 1
      
      commands.push(this.textToBytes(`\n\n`));
      commands.push(this.textToBytes(`Terimakasih telah berbelanja\n`));
      commands.push(this.textToBytes(`di toko kami\n`));
      commands.push(this.textToBytes(`^_^\n`));
      
      // Feed and cut
      commands.push(this.textToBytes(`\n\n\n\n`)); 
      commands.push(new Uint8Array([GS, 0x56, 0x00])); // GS V 0 - Full cut
      
      console.log(`Sending ${commands.length} commands to printer...`);
      
      // Method 1: Send each command separately
      for (let i = 0; i < commands.length; i++) {
        await BluetoothSerial.write(commands[i]);
        // Small delay between commands
        if (i < commands.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Method 2: Send as a raw string if Method 1 fails
      if (BluetoothSerial.write) {
        console.log('Sending raw text as fallback...');
        
        let rawText = 
          `${storeName}\n` +
          `${storeLocation}\n` +
          `${storePhone}\n\n`;
          
        if (customerName) {
          rawText += `Tuan/Bos: ${customerName}\n`;
        }
        
        rawText += 
          `--------------------------------\n` +
          `No - ${transactionId.slice(-4)}  ${formattedTime}  ${formattedDate}\n` +
          `--------------------------------\n\n`;
          
        items.forEach(item => {
          rawText += 
            `${item.product.name}\n` +
            `${item.quantity} x ${item.product.price} = ${item.product.price * item.quantity}\n\n`;
        });
        
        rawText +=
          `--------------------------------\n` +
          `Total: ${total}\n` +
          `Bayar (${paymentMethod === 'cash' ? 'Cash' : 'Transfer'}): ${cashAmount || total}\n` +
          `Kembali: ${changeAmount || 0}\n\n\n` +
          `Terimakasih telah berbelanja\n` +
          `di toko kami\n` +
          `^_^\n\n\n\n`;
          
        await BluetoothSerial.write(rawText);
      }
      
      console.log('Print completed via BluetoothSerial');
      return true;
    } catch (error) {
      console.error('Error printing with BluetoothSerial:', error);
      throw error;
    }
  }
  
  private async printWithBleClient(
    items: CartItem[],
    total: number,
    paymentMethod: string,
    customerName: string | undefined,
    cashAmount: number | undefined,
    changeAmount: number | undefined,
    transactionId: string,
    date: Date,
    storeName: string,
    storeLocation: string,
    storePhone: string
  ): Promise<boolean> {
    if (!BleClient) {
      console.log('BleClient not available');
      return false;
    }
    
    if (!this.connectedDevice) {
      return false;
    }
    
    console.log('Attempting to print with BleClient...');
    
    // Common printer service and characteristic UUIDs
    // Note: These are generic and might need to be adjusted for specific printer models
    const PRINTER_SERVICE = '18f0';
    const PRINTER_CHARACTERISTIC = '2af1';
    
    try {
      // Try to discover services
      const services = await BleClient.getServices(this.connectedDevice.id);
      console.log('Available services:', services);
      
      // Find a suitable printing service
      let printService = services.find(s => s.uuid.includes(PRINTER_SERVICE));
      if (!printService) {
        // Try to find any service with write characteristics
        printService = services.find(s => 
          s.characteristics.some(c => 
            c.properties && 
            // Fix: Check if 'write' property exists in the properties object
            c.properties.hasOwnProperty('write') && c.properties.write === true
          )
        );
      }
      
      if (!printService) {
        console.error('No suitable printer service found');
        return false;
      }
      
      // Find a suitable characteristic for writing
      let printCharacteristic = printService.characteristics.find(c => 
        c.uuid.includes(PRINTER_CHARACTERISTIC) && 
        c.properties && 
        // Fix: Check if 'write' property exists in the properties object
        c.properties.hasOwnProperty('write') && c.properties.write === true
      );
      
      if (!printCharacteristic) {
        printCharacteristic = printService.characteristics.find(c => 
          c.properties && 
          // Fix: Check if 'write' property exists in the properties object
          c.properties.hasOwnProperty('write') && c.properties.write === true
        );
      }
      
      if (!printCharacteristic) {
        console.error('No writable characteristic found');
        return false;
      }
      
      console.log('Using service:', printService.uuid, 'and characteristic:', printCharacteristic.uuid);
      
      // Create a simple text receipt
      let receiptText = 
        `${storeName}\n` +
        `${storeLocation}\n` +
        `${storePhone}\n\n`;
        
      if (customerName) {
        receiptText += `Customer: ${customerName}\n`;
      }
      
      const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      const formattedTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      receiptText += 
        `--------------------------------\n` +
        `No - ${transactionId.slice(-4)}  ${formattedTime}  ${formattedDate}\n` +
        `--------------------------------\n\n`;
        
      items.forEach(item => {
        receiptText += 
          `${item.product.name}\n` +
          `${item.quantity} x ${item.product.price} = ${item.product.price * item.quantity}\n\n`;
      });
      
      receiptText +=
        `--------------------------------\n` +
        `Total: ${total}\n` +
        `Bayar (${paymentMethod === 'cash' ? 'Cash' : 'Transfer'}): ${cashAmount || total}\n` +
        `Kembali: ${changeAmount || 0}\n\n\n` +
        `Terimakasih telah berbelanja\n` +
        `di toko kami\n` +
        `^_^\n\n\n\n`;
      
      // Convert to bytes
      const data = this.textToBytes(receiptText);
      
      // Split data into chunks (BLE has max packet size)
      const CHUNK_SIZE = 20; // Typical BLE MTU size
      
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        // Fix: Convert Uint8Array to DataView
        const dataView = new DataView(chunk.buffer);
        await BleClient.write(
          this.connectedDevice.id,
          printService.uuid,
          printCharacteristic.uuid,
          dataView
        );
        // Small delay between chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log('Print completed via BleClient');
      return true;
    } catch (error) {
      console.error('Error printing with BleClient:', error);
      throw error;
    }
  }
  
  // Helper method to convert string to bytes
  private textToBytes(text: string): Uint8Array {
    try {
      const encoder = new TextEncoder();
      return encoder.encode(text);
    } catch (error) {
      console.error('Error converting text to bytes:', error);
      // Fallback for older browsers
      const buffer = new Uint8Array(text.length);
      for (let i = 0; i < text.length; i++) {
        buffer[i] = text.charCodeAt(i);
      }
      return buffer;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.connectedDevice) {
        console.log('Disconnecting from printer:', this.connectedDevice);
        
        // Try BluetoothSerial first
        try {
          if (BluetoothSerial && BluetoothSerial.disconnect) {
            await BluetoothSerial.disconnect();
            console.log('Disconnected via BluetoothSerial');
          }
        } catch (serialError) {
          console.error('Error disconnecting with BluetoothSerial:', serialError);
        }
        
        // Try BleClient
        try {
          if (BleClient) {
            await BleClient.disconnect(this.connectedDevice.id);
            console.log('Disconnected via BleClient');
          }
        } catch (bleError) {
          console.error('Error disconnecting with BleClient:', bleError);
        }
        
        this.connectedDevice = null;
      }
    } catch (error) {
      console.error('Failed to disconnect from printer:', error);
    }
  }

  public getConnectedDevice(): PrinterDevice | null {
    return this.connectedDevice;
  }
}

export default BluetoothPrinterService.getInstance();
