
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { createPluginProxy } from '../utils/capacitorShim';

// Define the plugin interface to ensure type safety
interface BluetoothPrinterPlugin {
  initialize: () => Promise<{ value: boolean }>;
  scan: (options?: { scanDuration?: number }) => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  connect: (options: { address: string }) => Promise<{ value: boolean }>;
  disconnect: () => Promise<{ value: boolean }>;
  print: (options: { text: string }) => Promise<{ value: boolean }>;
  getPairedDevices?: () => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  isBluetoothEnabled?: () => Promise<{ value: boolean }>;
  enableBluetooth?: () => Promise<{ value: boolean }>;
  requestBluetoothPermissions?: () => Promise<{ value: boolean }>;
}

// Create a proxy for the BluetoothPrinter plugin to avoid direct import issues
const BluetoothPrinter = createPluginProxy('BluetoothPrinter') as BluetoothPrinterPlugin;

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
}

class BluetoothPrinterServiceClass {
  private connectedDevice: PrinterDevice | null = null;
  private isInitialized = false;
  private lastScanTime: number = 0;
  private scanInProgress: boolean = false;
  private scanTimeoutId: any = null;
  private printerModels: Record<string, string> = {
    'EcoPrint': 'ESC/POS',
    'MTP-': 'ESC/POS',
    'MPT-': 'ESC/POS',
    'HM-': 'ESC/POS',
    'PTP-': 'ESC/POS',
    'ZJ-': 'CPCL',
    'CPCL': 'CPCL',
  };
  private initAttempts: number = 0;
  private maxInitAttempts: number = 3;

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
      
      // Request necessary permissions first
      if (BluetoothPrinter.requestBluetoothPermissions) {
        try {
          await BluetoothPrinter.requestBluetoothPermissions();
          console.log('Bluetooth permissions requested');
        } catch (error) {
          console.error('Failed to request Bluetooth permissions:', error);
        }
      }
      
      // Check if Bluetooth is enabled with retry
      if (BluetoothPrinter.isBluetoothEnabled) {
        let bluetoothEnabled = false;
        try {
          const bluetoothStatus = await BluetoothPrinter.isBluetoothEnabled();
          bluetoothEnabled = bluetoothStatus.value;
        } catch (error) {
          console.error('Error checking Bluetooth status:', error);
        }
        
        if (!bluetoothEnabled) {
          console.log('Bluetooth is disabled. Attempting to enable...');
          if (BluetoothPrinter.enableBluetooth) {
            try {
              const enabled = await BluetoothPrinter.enableBluetooth();
              if (!enabled.value) {
                toast.error("Mohon aktifkan Bluetooth untuk menggunakan printer", { duration: 3000 });
                return false;
              }
            } catch (error) {
              console.error('Failed to enable Bluetooth:', error);
              toast.error("Gagal mengaktifkan Bluetooth. Harap aktifkan secara manual", { duration: 3000 });
              return false;
            }
          } else {
            toast.error("Mohon aktifkan Bluetooth untuk menggunakan printer", { duration: 3000 });
            return false;
          }
        }
      }
      
      // Use multiple attempts to initialize
      let initialized = false;
      this.initAttempts = 0;
      
      while (!initialized && this.initAttempts < this.maxInitAttempts) {
        this.initAttempts++;
        try {
          console.log(`Initialization attempt ${this.initAttempts}...`);
          const result = await BluetoothPrinter.initialize();
          initialized = result.value;
          
          if (initialized) {
            console.log('Bluetooth printer initialized successfully');
            break;
          } else {
            console.log(`Initialization attempt ${this.initAttempts} failed, retrying...`);
            // Small delay between attempts
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Initialization attempt ${this.initAttempts} error:`, error);
          if (this.initAttempts >= this.maxInitAttempts) {
            throw error;
          }
          // Continue to next attempt with a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      this.isInitialized = initialized;
      return initialized;
    } catch (error) {
      console.error('Failed to initialize Bluetooth printer:', error);
      toast.error("Gagal menginisialisasi printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"), 
        { duration: 3000 });
      return false;
    }
  }

  // Get already paired printers - essential for most stable connections
  async getPairedPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log("Not a native platform, can't get paired devices");
        return [];
      }
      
      if (!BluetoothPrinter.getPairedDevices) {
        console.log("getPairedDevices method not available");
        return [];
      }
      
      await this.init();
      
      console.log("Retrieving paired devices...");
      const result = await BluetoothPrinter.getPairedDevices();
      
      if (!result.value || !result.devices) {
        console.log("No paired devices found or failed to retrieve them");
        return [];
      }
      
      console.log("All paired devices:", result.devices);
      
      // Filter devices that are likely printers based on common naming patterns
      const likelyPrinters = result.devices.filter(device => {
        const name = (device.name || "").toUpperCase();
        
        // Known printer prefixes and keywords - expanded list
        const printerKeywords = [
          'PRINT', 'POS', 'THERMAL', 'RECEIPT', 'BT', 'PT-', 'TSC', 'ZJ', 
          'MTP', 'MPT', 'ELO', 'STAR', 'EPSON', 'BIXOLON', 'ECOPRINT', 'ECO',
          'PRINTER', 'HM-', 'TP-', 'PTP-', 'SPRT', 'CPCL', 'MINI', 'SPP',
          'RPP', 'PAPERANG', 'P1', 'P2', 'A6', 'A8', 'RECEIPT'
        ];
        
        return printerKeywords.some(keyword => name.includes(keyword));
      });
      
      // If no printers were detected by keywords, return all Bluetooth devices as potential printers
      const devicesToReturn = likelyPrinters.length > 0 ? likelyPrinters : result.devices;
      
      const devices: PrinterDevice[] = devicesToReturn.map(device => ({
        id: device.address,
        name: device.name || 'Unknown Device',
        address: device.address
      }));
      
      console.log('Found paired printers:', devices);
      return devices;
    } catch (error) {
      console.error('Failed to get paired devices:', error);
      return [];
    }
  }

  async scanForPrinters(scanDuration: number = 20000): Promise<PrinterDevice[]> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log("Not a native platform, can't scan for printers");
        toast.error("Bluetooth printing hanya berfungsi di aplikasi Android/iOS");
        return [];
      }
      
      // Cancel any existing scan
      this.cancelScan();
      
      // Initialize first with retry
      const initialized = await this.init();
      if (!initialized) {
        console.log("Failed to initialize Bluetooth printer service");
        toast.error("Gagal menginisialisasi layanan printer Bluetooth. Silakan periksa pengaturan Bluetooth Anda");
        return [];
      }
      
      // Check if a scan was recently performed (within last 2 seconds)
      const currentTime = Date.now();
      if (currentTime - this.lastScanTime < 2000 && !this.scanInProgress) {
        console.log('Scan requested too soon after previous scan, trying to get paired devices instead');
        // Try to get paired devices instead of scanning again
        const pairedDevices = await this.getPairedPrinters();
        if (pairedDevices.length > 0) {
          return pairedDevices;
        }
      }
      
      this.scanInProgress = true;
      console.log(`Scanning for Bluetooth printers with ${scanDuration}ms duration...`);
      toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
      
      // Create a promise that will be resolved with the scan results
      const scanPromise = new Promise<PrinterDevice[]>(async (resolve) => {
        try {
          const result = await BluetoothPrinter.scan({
            scanDuration: scanDuration
          });
          
          this.lastScanTime = Date.now();
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          
          if (!result.value) {
            console.log('No printers found or scan failed');
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer Bluetooth dinyalakan dan dalam mode pairing.");
            resolve([]);
            return;
          }
          
          const allDevices: PrinterDevice[] = Array.isArray(result.devices) ? result.devices.map(device => ({
            id: device.address,
            name: device.name || 'Unknown Device',
            address: device.address
          })) : [];
          
          console.log('All scanned devices:', allDevices);
          
          // If no devices found, try to get paired devices
          if (allDevices.length === 0) {
            console.log('No devices found in scan, checking paired devices');
            const pairedDevices = await this.getPairedPrinters();
            if (pairedDevices.length > 0) {
              console.log('Found paired devices:', pairedDevices);
              resolve(pairedDevices);
              return;
            }
          }
          
          // Return all found devices - don't filter as it might exclude some valid printers
          console.log('Found printers:', allDevices);
          
          if (allDevices.length === 0) {
            toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing dan dekat dengan perangkat Anda.");
          }
          
          resolve(allDevices);
        } catch (error) {
          console.error('Error scanning for printers:', error);
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
          
          // Try to get paired devices as fallback
          try {
            console.log('Scan failed, trying paired devices as fallback');
            const pairedDevices = await this.getPairedPrinters();
            resolve(pairedDevices);
          } catch (fallbackError) {
            console.error('Fallback to paired devices also failed:', fallbackError);
            resolve([]);
          }
        }
      });
      
      // Set a timeout to cancel the scan if it takes too long
      this.scanTimeoutId = setTimeout(() => {
        if (this.scanInProgress) {
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.error("Waktu memindai terlalu lama. Printer mungkin tidak dalam jangkauan atau mode pairing.");
        }
      }, scanDuration + 5000); // Give a little extra time beyond the scan duration
      
      return scanPromise;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      this.scanInProgress = false;
      toast.dismiss("scanning-printers");
      toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
      
      // Try to get paired devices as fallback
      try {
        console.log('Error in scan, trying paired devices as fallback');
        return await this.getPairedPrinters();
      } catch (fallbackError) {
        console.error('Fallback to paired devices also failed:', fallbackError);
        return [];
      }
    }
  }
  
  cancelScan() {
    if (this.scanTimeoutId) {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
    }
    
    if (this.scanInProgress) {
      this.scanInProgress = false;
      toast.dismiss("scanning-printers");
    }
  }

  async connectToPrinter(printer: PrinterDevice): Promise<boolean> {
    try {
      await this.init();
      console.log('Connecting to printer:', printer);
      toast.loading(`Menghubungkan ke printer: ${printer.name}...`, { id: "connecting-printer" });
      
      // Try multiple times to connect (up to 3 attempts)
      let connected = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!connected && attempts < maxAttempts) {
        attempts++;
        try {
          const result = await BluetoothPrinter.connect({
            address: printer.address
          });
          
          if (result.value) {
            connected = true;
            break;
          } else {
            console.log(`Connection attempt ${attempts} failed`);
            // Small delay between attempts
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (err) {
          console.error(`Connection attempt ${attempts} error:`, err);
          // Continue to next attempt
        }
      }
      
      toast.dismiss("connecting-printer");
      
      if (connected) {
        this.connectedDevice = printer;
        console.log('Successfully connected to printer');
        toast.success(`Terhubung ke printer: ${printer.name}`);
        return true;
      } else {
        console.log('Failed to connect to printer after multiple attempts');
        toast.error(`Gagal terhubung ke printer: ${printer.name}. Pastikan printer dinyalakan dan dalam mode pairing.`);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.dismiss("connecting-printer");
      toast.error(`Gagal terhubung ke printer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // Format text for specific printer models (especially EcoPrint)
  formatForPrinter(text: string): string {
    if (!this.connectedDevice) return text;
    
    const printerName = (this.connectedDevice.name || '').toUpperCase();
    
    // For EcoPrint and similar ESC/POS printers
    if (printerName.includes('ECO') || 
        printerName.includes('POS') || 
        printerName.includes('THERMAL') ||
        printerName.includes('MTP') ||
        printerName.includes('BT')) {
      return this.formatForESCPOS(text);
    }
    
    // For generic printers, just return the text
    return text;
  }
  
  // Format specifically for ESC/POS printers like EcoPrint
  formatForESCPOS(text: string): string {
    // Initialize the printer
    let formatted = '\x1B@';
    
    // Set text alignment to center
    formatted += '\x1B\x61\x01';
    
    // Add the text
    formatted += text;
    
    // Cut paper (if supported)
    formatted += '\x1D\x56\x42\x00';
    
    // Feed paper and reset to default
    formatted += '\n\n\n\x1B@';
    
    return formatted;
  }
  
  // Alternative format for different printer models
  formatAlternative(text: string): string {
    // Format with simpler commands, focusing on just the text
    let formatted = '\x1B@'; // Initialize
    formatted += text;
    formatted += '\n\n\n\n'; // Feed paper
    return formatted;
  }
  
  // Raw format without special formatting (for troubleshooting)
  formatRaw(text: string): string {
    // Just add line feeds at end
    return text + '\n\n\n\n';
  }

  async printText(text: string): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Not a native platform, printing unavailable');
        toast.error("Printing hanya berfungsi di aplikasi Android/iOS");
        return false;
      }
      
      if (!this.connectedDevice) {
        console.log('No printer connected, attempting to connect to a paired printer');
        const pairedPrinters = await this.getPairedPrinters();
        if (pairedPrinters.length > 0) {
          const connected = await this.connectToPrinter(pairedPrinters[0]);
          if (!connected) {
            toast.error("Tidak ada printer yang terhubung dan gagal menghubungkan ke printer yang tersedia.");
            return false;
          }
        } else {
          toast.error("Tidak ada printer yang terhubung. Silakan hubungkan printer terlebih dahulu.");
          return false;
        }
      }
      
      await this.init();
      console.log('Printing text:', text.substring(0, 50) + '...');
      toast.loading("Mencetak...", { id: "printing" });
      
      // Try to print with multiple attempts and different formats if needed
      let success = false;
      let formatAttempts = 0;
      const maxFormatAttempts = 3;
      
      while (!success && formatAttempts < maxFormatAttempts) {
        formatAttempts++;
        
        let textToSend;
        if (formatAttempts === 1) {
          // First attempt: use printer-specific format
          console.log("Attempt 1: Using printer-specific format");
          textToSend = this.formatForPrinter(text);
        } else if (formatAttempts === 2) {
          // Second attempt: use alternative format
          console.log("Attempt 2: Using alternative format");
          textToSend = this.formatAlternative(text);
        } else {
          // Third attempt: use raw text
          console.log("Attempt 3: Using raw text format");
          textToSend = this.formatRaw(text);
        }
        
        // For each format, try multiple connection attempts
        let printAttempts = 0;
        const maxPrintAttempts = 2;
        
        while (!success && printAttempts < maxPrintAttempts) {
          printAttempts++;
          try {
            console.log(`Print attempt ${printAttempts} with format ${formatAttempts}`);
            const result = await BluetoothPrinter.print({
              text: textToSend
            });
            
            if (result.value) {
              success = true;
              break;
            } else {
              console.log(`Print attempt ${printAttempts} with format ${formatAttempts} failed`);
              // Small delay between attempts
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            console.error(`Print attempt ${printAttempts} with format ${formatAttempts} error:`, err);
            // Continue to next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (success) break;
      }
      
      toast.dismiss("printing");
      
      if (success) {
        toast.success("Berhasil mencetak!");
        return true;
      } else {
        toast.error("Gagal mencetak. Pastikan printer masih terhubung dan dinyalakan.");
        
        // Try reconnecting to the printer
        try {
          if (this.connectedDevice) {
            console.log("Attempting to reconnect to printer");
            await this.connectToPrinter(this.connectedDevice);
          }
        } catch (reconnectError) {
          console.error("Failed to reconnect to printer:", reconnectError);
        }
        
        return false;
      }
    } catch (error) {
      console.error('Failed to print:', error);
      toast.dismiss("printing");
      toast.error(`Gagal mencetak: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
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
        toast.success("Terputus dari printer");
      }
      
      return result.value;
    } catch (error) {
      console.error('Failed to disconnect from printer:', error);
      throw error;
    }
  }
  
  // Helper method to provide troubleshooting information
  getTroubleshootingInfo(): string[] {
    return [
      "1. Pastikan printer EcoPrint Anda dalam mode pairing (biasanya dengan menekan tombol power selama 3-5 detik sampai LED berkedip).",
      "2. Pastikan Bluetooth dan lokasi pada Android Anda diaktifkan (izin lokasi diperlukan untuk pemindaian Bluetooth).",
      "3. Jika printer sudah terpasang sebelumnya di pengaturan Bluetooth Android, coba hapus dan pasangkan ulang.",
      "4. Pastikan printer cukup dekat (dalam jangkauan 5-10 meter) dan baterai printer penuh.",
      "5. Restart printer dengan mematikan dan menghidupkan kembali.",
      "6. Pastikan printer dalam keadaan siap (LED berwarna hijau atau biru).",
      "7. Jika semua langkah gagal, coba restart aplikasi dan perangkat Android Anda."
    ];
  }
  
  // Check if printer is ready by attempting a connection
  async isPrinterReady(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        return false;
      }
      
      // Try to reconnect to ensure connection is still valid
      return await this.connectToPrinter(this.connectedDevice);
    } catch (error) {
      console.error('Error checking printer readiness:', error);
      return false;
    }
  }
}

const BluetoothPrinterService = new BluetoothPrinterServiceClass();
export default BluetoothPrinterService;
