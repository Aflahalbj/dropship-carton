
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { createPluginProxy } from '../utils/capacitorShim';

// Define the plugin interface to ensure type safety
interface BluetoothPrinterPlugin {
  initialize: () => Promise<{ value: boolean }>;
  scan: (options?: { scanDuration?: number, forceDiscovery?: boolean }) => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  connect: (options: { address: string, forcePairing?: boolean }) => Promise<{ value: boolean }>;
  disconnect: () => Promise<{ value: boolean }>;
  print: (options: { text: string, printMode?: string }) => Promise<{ value: boolean }>;
  getPairedDevices?: () => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  isBluetoothEnabled?: () => Promise<{ value: boolean }>;
  enableBluetooth?: () => Promise<{ value: boolean }>;
  requestBluetoothPermissions?: () => Promise<{ value: boolean }>;
  isPrinterConnected?: () => Promise<{ value: boolean }>;
  testConnection?: () => Promise<{ value: boolean }>;
  resetPrinter?: () => Promise<{ value: boolean }>;
}

// Create proxy for the BluetoothPrinter plugin
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
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 8;
  private printerModels: Record<string, string> = {
    // Expanded database of printer models and their protocols
    'ECOPRINT': 'ESC/POS',
    'ECO': 'ESC/POS',
    'MTP-': 'ESC/POS',
    'MPT-': 'ESC/POS',
    'HM-': 'ESC/POS',
    'PTP-': 'ESC/POS',
    'THERMAL': 'ESC/POS',
    'ZJ-': 'CPCL',
    'CPCL': 'CPCL',
    'POS-': 'ESC/POS',
    'BLUETOOTHPRINTER': 'ESC/POS',
    'BTPRINTER': 'ESC/POS',
    'PRINTER': 'ESC/POS',
    'HC-': 'ESC/POS',    // Generic Bluetooth modules often used in printers
    'SPP': 'ESC/POS',
    'BT': 'ESC/POS',
    'TM-': 'ESC/POS',    // Epson
    'TSC': 'TSPL',
    'EPSON': 'ESC/POS',
    'BIXOLON': 'ESC/POS',
    'POS58': 'ESC/POS',  // Common 58mm printer
    'POS80': 'ESC/POS',  // Common 80mm printer
    'PT-': 'ESC/POS'
  };
  private initAttempts: number = 0;
  private maxInitAttempts: number = 5;
  private printFormatAttempts: string[] = [
    'DEFAULT',           // Format standar
    'ECOPRINT',          // Format khusus EcoPrint
    'SIMPLE_ESCPOS',     // Format ESC/POS sederhana
    'GENERIC_58MM',      // Format untuk printer 58mm
    'GENERIC_80MM',      // Format untuk printer 80mm
    'RAW_TEXT',          // Teks mentah tanpa formatting
    'MINIMAL_COMMANDS',  // Perintah minimal
    'FULL_RESET'         // Reset penuh dan cetak
  ];

  constructor() {
    console.info('BluetoothPrinterService initialized:', {
      isNativeApp: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
      version: '2.0'
    });
  }

  async init(): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Bluetooth printing only works on native platforms');
        return false;
      }
      
      if (this.isInitialized) {
        console.log('Printer service already initialized');
        return true;
      }
      
      // Request necessary permissions first
      if (BluetoothPrinter.requestBluetoothPermissions) {
        try {
          console.log('Requesting Bluetooth permissions...');
          await BluetoothPrinter.requestBluetoothPermissions();
          console.log('Bluetooth permissions granted');
        } catch (error) {
          console.error('Failed to request Bluetooth permissions:', error);
          // Continue anyway as some permissions might have been granted
        }
      }
      
      // Check if Bluetooth is enabled with multiple retries
      if (BluetoothPrinter.isBluetoothEnabled) {
        let bluetoothEnabled = false;
        let bluetoothCheckAttempts = 0;
        const maxBluetoothCheckAttempts = 3;
        
        while (!bluetoothEnabled && bluetoothCheckAttempts < maxBluetoothCheckAttempts) {
          try {
            bluetoothCheckAttempts++;
            console.log(`Checking if Bluetooth is enabled (attempt ${bluetoothCheckAttempts})...`);
            const bluetoothStatus = await BluetoothPrinter.isBluetoothEnabled();
            bluetoothEnabled = bluetoothStatus.value;
            
            if (bluetoothEnabled) {
              console.log('Bluetooth is enabled');
              break;
            } else {
              console.log('Bluetooth is disabled. Attempting to enable...');
              
              if (BluetoothPrinter.enableBluetooth) {
                try {
                  const enabled = await BluetoothPrinter.enableBluetooth();
                  if (enabled.value) {
                    console.log('Successfully enabled Bluetooth');
                    bluetoothEnabled = true;
                    break;
                  } else {
                    console.log('Failed to enable Bluetooth automatically');
                    // Wait before next attempt
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                } catch (enableError) {
                  console.error('Error enabling Bluetooth:', enableError);
                  // Wait before next attempt
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              } else {
                toast.error("Mohon aktifkan Bluetooth secara manual", { duration: 5000 });
                return false;
              }
            }
          } catch (error) {
            console.error(`Error checking Bluetooth status (attempt ${bluetoothCheckAttempts}):`, error);
            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (!bluetoothEnabled) {
          toast.error("Mohon aktifkan Bluetooth untuk menggunakan printer", { duration: 5000 });
          return false;
        }
      }
      
      // Multiple initialization attempts
      this.initAttempts = 0;
      let initialized = false;
      
      while (!initialized && this.initAttempts < this.maxInitAttempts) {
        this.initAttempts++;
        try {
          console.log(`Initialization attempt ${this.initAttempts}...`);
          const result = await BluetoothPrinter.initialize();
          initialized = result.value;
          
          if (initialized) {
            console.log('Bluetooth printer initialized successfully');
            this.isInitialized = true;
            break;
          } else {
            console.log(`Initialization attempt ${this.initAttempts} failed, retrying...`);
            // Small delay between attempts with increasing duration
            await new Promise(resolve => setTimeout(resolve, this.initAttempts * 500));
          }
        } catch (error) {
          console.error(`Initialization attempt ${this.initAttempts} error:`, error);
          // Continue to next attempt with delay
          await new Promise(resolve => setTimeout(resolve, this.initAttempts * 500));
        }
      }
      
      if (!initialized) {
        console.log('Failed to initialize printer service after multiple attempts');
        toast.error("Gagal menginisialisasi printer. Pastikan Bluetooth aktif dan izin diberikan", { 
          duration: 5000,
          action: {
            label: "Coba Lagi",
            onClick: () => this.init()
          }
        });
      }
      
      return initialized;
    } catch (error) {
      console.error('Error initializing Bluetooth printer:', error);
      toast.error("Gagal menginisialisasi printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
      return false;
    }
  }

  async getPairedPrinters(): Promise<PrinterDevice[]> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log("Not running on native platform, can't get paired devices");
        return [];
      }
      
      if (!BluetoothPrinter.getPairedDevices) {
        console.log("getPairedDevices method not available in the plugin");
        return [];
      }
      
      await this.init();
      
      console.log("Retrieving paired devices...");
      const result = await BluetoothPrinter.getPairedDevices();
      
      if (!result.value || !result.devices) {
        console.log("No paired devices found or failed to retrieve them");
        return [];
      }
      
      console.log("All paired Bluetooth devices:", result.devices);
      
      // Return ALL paired devices as potential printers
      // This is crucial for detecting generic printers or those with unusual names
      const devices: PrinterDevice[] = result.devices.map(device => ({
        id: device.address,
        name: device.name || 'Unknown Device',
        address: device.address
      }));
      
      console.log('Found paired potential printer devices:', devices);
      return devices;
    } catch (error) {
      console.error('Failed to get paired devices:', error);
      return [];
    }
  }

  async scanForPrinters(scanDuration: number = 30000): Promise<PrinterDevice[]> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log("Not running on native platform, can't scan for printers");
        toast.error("Bluetooth printing hanya berfungsi di aplikasi Android/iOS");
        return [];
      }
      
      // Cancel any existing scan
      this.cancelScan();
      
      // Initialize with multiple retries
      const initialized = await this.init();
      if (!initialized) {
        console.log("Failed to initialize Bluetooth printer service");
        toast.error("Gagal menginisialisasi layanan printer Bluetooth. Silakan periksa pengaturan Bluetooth Anda");
        return [];
      }
      
      this.scanInProgress = true;
      console.log(`Starting Bluetooth device scan with ${scanDuration}ms duration...`);
      toast.loading("Memindai printer Bluetooth...", { id: "scanning-printers" });
      
      // Create a promise that will be resolved with the scan results
      const scanPromise = new Promise<PrinterDevice[]>(async (resolve) => {
        try {
          // Use forced discovery mode for better results with all printers
          const result = await BluetoothPrinter.scan({
            scanDuration: scanDuration,
            forceDiscovery: true // Force discovery mode to find more devices
          });
          
          this.lastScanTime = Date.now();
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          
          if (!result.value || !result.devices || result.devices.length === 0) {
            console.log('No devices found in scan');
            
            // If no devices found, try to get paired devices as fallback
            const pairedDevices = await this.getPairedPrinters();
            if (pairedDevices.length > 0) {
              console.log('Found paired devices as fallback:', pairedDevices);
              toast.info(`Ditemukan ${pairedDevices.length} perangkat Bluetooth yang telah dipasangkan sebelumnya`);
              resolve(pairedDevices);
            } else {
              toast.error("Tidak ada printer yang ditemukan. Pastikan printer dalam mode pairing (lampu berkedip)");
              resolve([]);
            }
            return;
          }
          
          // Return ALL found devices as potential printers
          const allDevices: PrinterDevice[] = result.devices.map(device => ({
            id: device.address,
            name: device.name || 'Unknown Device',
            address: device.address
          }));
          
          console.log('Found Bluetooth devices:', allDevices);
          
          if (allDevices.length > 0) {
            toast.success(`${allDevices.length} perangkat Bluetooth ditemukan`);
            resolve(allDevices);
          } else {
            // As a final fallback, check paired devices again
            const pairedDevices = await this.getPairedPrinters();
            resolve(pairedDevices);
          }
        } catch (error) {
          console.error('Error scanning for printers:', error);
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
          
          // Try paired devices as fallback
          try {
            const pairedDevices = await this.getPairedPrinters();
            console.log('Using paired devices as fallback after scan error:', pairedDevices);
            resolve(pairedDevices);
          } catch (fallbackError) {
            console.error('Fallback to paired devices also failed:', fallbackError);
            resolve([]);
          }
        }
      });
      
      // Set a timeout for the scan
      this.scanTimeoutId = setTimeout(() => {
        if (this.scanInProgress) {
          this.scanInProgress = false;
          toast.dismiss("scanning-printers");
          toast.warning("Scan timeout. Memastikan semua perangkat terdeteksi...");
          // We don't reject the promise as the scan might still return results
        }
      }, scanDuration + 5000);
      
      return scanPromise;
    } catch (error) {
      console.error('Error in scanForPrinters:', error);
      this.scanInProgress = false;
      toast.dismiss("scanning-printers");
      toast.error("Gagal memindai printer: " + (error instanceof Error ? error.message : "Error tidak diketahui"));
      
      // Always try paired devices as fallback if anything fails
      try {
        return await this.getPairedPrinters();
      } catch (fallbackError) {
        console.error('Fallback to paired devices failed:', fallbackError);
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
    this.connectionAttempts = 0;
    
    try {
      await this.init();
      console.log('Connecting to printer:', printer);
      toast.loading(`Menghubungkan ke ${printer.name}...`, { id: "connecting-printer", duration: 15000 });
      
      // Reset connection attempts counter for new connection
      this.connectionAttempts = 0;
      let connected = false;
      
      // Increased connection attempts with various techniques
      while (!connected && this.connectionAttempts < this.maxConnectionAttempts) {
        this.connectionAttempts++;
        try {
          console.log(`Connection attempt ${this.connectionAttempts} for ${printer.name} (${printer.address})`);
          
          // Use different connection approaches based on attempt number
          let connectionOptions: any = { address: printer.address };
          
          // For later attempts, try forcing the pairing mode
          if (this.connectionAttempts > 3) {
            connectionOptions.forcePairing = true;
            console.log("Using forced pairing mode for this attempt");
          }
          
          // For EcoPrint or unknown printers, try special handling on certain attempts
          const printerNameUpper = (printer.name || '').toUpperCase();
          if (printerNameUpper.includes('ECO') || printerNameUpper.includes('UNKNOWN') || 
              printerNameUpper === '' || printerNameUpper.includes('BT')) {
            if (this.connectionAttempts % 2 === 0) {
              console.log("Using special EcoPrint handling for this attempt");
              // Special handling for EcoPrint - wait a bit longer
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          const result = await BluetoothPrinter.connect(connectionOptions);
          
          if (result.value) {
            connected = true;
            console.log(`Successfully connected to printer on attempt ${this.connectionAttempts}`);
            break;
          } else {
            console.log(`Connection attempt ${this.connectionAttempts} failed, result:`, result);
            
            // Progressive delay between attempts
            const delayTime = Math.min(1000 + (this.connectionAttempts * 500), 3000);
            await new Promise(resolve => setTimeout(resolve, delayTime));
          }
        } catch (err) {
          console.error(`Connection attempt ${this.connectionAttempts} error:`, err);
          
          // For specific errors, we might need special handling
          if (err instanceof Error && err.message.includes('already connected')) {
            // If already connected, consider it a success
            console.log("Device reports already connected, treating as success");
            connected = true;
            break;
          }
          
          // Progressive delay between attempts after errors
          const delayTime = Math.min(1000 + (this.connectionAttempts * 700), 4000);
          await new Promise(resolve => setTimeout(resolve, delayTime));
        }
      }
      
      toast.dismiss("connecting-printer");
      
      if (connected) {
        this.connectedDevice = printer;
        console.log('Successfully connected to printer:', printer.name);
        toast.success(`Terhubung ke ${printer.name}`);
        
        // Verify connection with a test print (small and quick)
        try {
          console.log('Sending small test print to verify connection...');
          const testPrintSuccess = await this.printText("\n.\n");
          
          if (testPrintSuccess) {
            console.log('Test print successful, connection is fully working');
          } else {
            console.log('Test print failed but connection was established');
            // Still consider connected but warn user
            toast.warning("Koneksi berhasil tetapi test print gagal. Printer mungkin kehabisan kertas.", { duration: 3000 });
          }
        } catch (testError) {
          console.error('Test print error:', testError);
          // Don't change connection status
        }
        
        return true;
      } else {
        console.log('Failed to connect to printer after multiple attempts');
        toast.error(`Gagal terhubung ke ${printer.name}. Pastikan printer dalam mode pairing (lampu berkedip).`);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      toast.dismiss("connecting-printer");
      toast.error(`Gagal terhubung: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  getFormattingForPrinter(text: string, formatType: string): string {
    // Expanded printer formats for various printer models
    switch (formatType) {
      case 'DEFAULT':
        // Standard ESC/POS format with center alignment
        return '\x1B@\x1B\x61\x01' + text + '\n\n\n\x1D\x56\x42\x00';
        
      case 'ECOPRINT':
        // Special format for EcoPrint printers
        return '\x1B@\x1D\x21\x00\x1B\x61\x01' + text + '\n\n\n\n';
        
      case 'SIMPLE_ESCPOS':
        // Simplified ESC/POS with minimal commands
        return '\x1B@' + text + '\n\n\n';
        
      case 'GENERIC_58MM':
        // Format for standard 58mm thermal printers
        return '\x1B@\x1B!\x00\x1B\x61\x01' + text + '\n\n\n';
        
      case 'GENERIC_80MM':
        // Format for standard 80mm thermal printers
        return '\x1B@\x1B!\x00\x1B\x61\x01' + text + '\n\n\n';
        
      case 'RAW_TEXT':
        // Raw text with only line feeds
        return text + '\n\n\n\n';
        
      case 'MINIMAL_COMMANDS':
        // Only minimal init command
        return '\x1B@' + text + '\n\n\n\n';
        
      case 'FULL_RESET':
        // Full reset and initialization sequence
        return '\x1B\x40\x1D\x49\x01\x1B\x61\x01' + text + '\n\n\n\n\x1D\x56\x42\x00';
        
      default:
        // Default format as fallback
        return '\x1B@\x1B\x61\x01' + text + '\n\n\n';
    }
  }

  // Enhanced print method with multiple formats and attempts
  async printText(text: string): Promise<boolean> {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log('Not a native platform, printing unavailable');
        toast.error("Printing hanya berfungsi di aplikasi Android/iOS");
        return false;
      }
      
      // Make sure we're initialized
      await this.init();
      
      // Check if we have a connected device
      if (!this.connectedDevice) {
        console.log('No printer connected, attempting auto-connection');
        
        // Try to connect to paired printer first
        const pairedPrinters = await this.getPairedPrinters();
        if (pairedPrinters.length > 0) {
          console.log('Found paired printers, trying to connect to:', pairedPrinters[0]);
          const connected = await this.connectToPrinter(pairedPrinters[0]);
          if (!connected) {
            console.log('Failed to connect to paired printer, scanning for available printers');
            
            // If can't connect to paired printer, scan for new ones
            const scannedPrinters = await this.scanForPrinters(30000); // Extended scan time
            
            if (scannedPrinters.length === 0) {
              toast.error("Tidak ada printer yang tersedia. Pastikan printer dalam mode pairing (lampu berkedip).");
              return false;
            }
            
            // Try to connect to the first scanned printer
            const scanConnected = await this.connectToPrinter(scannedPrinters[0]);
            if (!scanConnected) {
              toast.error("Gagal menghubungkan ke printer yang ditemukan.");
              return false;
            }
          }
        } else {
          console.log('No paired printers found, scanning for available printers');
          const scannedPrinters = await this.scanForPrinters(30000); // Extended scan time
          
          if (scannedPrinters.length === 0) {
            toast.error("Tidak ada printer yang terdeteksi. Pastikan printer dalam mode pairing (lampu berkedip).");
            return false;
          }
          
          // Try to connect to first scanned printer
          const connected = await this.connectToPrinter(scannedPrinters[0]);
          if (!connected) {
            toast.error("Gagal terhubung ke printer. Pastikan printer dalam mode pairing.");
            return false;
          }
        }
      }
      
      // Verify the printer is still connected
      let printerReady = false;
      
      if (BluetoothPrinter.isPrinterConnected) {
        try {
          const readyStatus = await BluetoothPrinter.isPrinterConnected();
          printerReady = readyStatus.value;
        } catch (error) {
          console.log('Error checking if printer is connected:', error);
          // Assume printer is not ready
        }
      } else {
        // If method not available, assume printer is ready
        printerReady = true;
      }
      
      if (!printerReady && this.connectedDevice) {
        console.log('Printer connection lost, attempting to reconnect');
        const reconnected = await this.connectToPrinter(this.connectedDevice);
        
        if (!reconnected) {
          toast.error("Koneksi printer terputus dan gagal menghubungkan kembali.");
          return false;
        }
      }
      
      // Now proceed with printing using multiple format attempts
      console.log('Starting print sequence with multiple format attempts...');
      toast.loading("Mencetak...", { id: "printing", duration: 20000 });
      
      // Try each format until one works
      let success = false;
      
      for (let i = 0; i < this.printFormatAttempts.length; i++) {
        const formatType = this.printFormatAttempts[i];
        const formattedText = this.getFormattingForPrinter(text, formatType);
        
        console.log(`Print attempt ${i+1} using format: ${formatType}`);
        
        // For each format, try multiple print attempts
        for (let j = 0; j < 3; j++) {
          try {
            console.log(`Print sub-attempt ${j+1} with format ${formatType}`);
            
            // Use different print modes in later attempts
            const printMode = j === 0 ? undefined : (j === 1 ? 'text' : 'binary');
            
            const result = await BluetoothPrinter.print({
              text: formattedText,
              printMode: printMode
            });
            
            if (result.value) {
              success = true;
              console.log(`Print successful with format ${formatType} on attempt ${j+1}`);
              break;
            } else {
              console.log(`Print failed with format ${formatType} on attempt ${j+1}`);
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (err) {
            console.error(`Print error with format ${formatType} on attempt ${j+1}:`, err);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        if (success) break;
        
        // If this format didn't work, wait before trying next format
        if (i < this.printFormatAttempts.length - 1) {
          console.log(`Format ${formatType} failed. Waiting before trying next format...`);
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      toast.dismiss("printing");
      
      if (success) {
        toast.success("Berhasil mencetak!");
        return true;
      } else {
        // Attempt printer reset as last resort
        if (BluetoothPrinter.resetPrinter) {
          toast.loading("Mencoba reset printer...", { id: "resetting" });
          try {
            await BluetoothPrinter.resetPrinter();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try one more print after reset
            const resetResult = await BluetoothPrinter.print({
              text: '\x1B@\x1B\x61\x01' + text + '\n\n\n'
            });
            
            toast.dismiss("resetting");
            
            if (resetResult.value) {
              toast.success("Berhasil mencetak setelah reset printer!");
              return true;
            }
          } catch (resetError) {
            console.error('Error resetting printer:', resetError);
            toast.dismiss("resetting");
          }
        }
        
        toast.error("Gagal mencetak. Pastikan printer masih terhubung, terisi kertas, dan baterai penuh.", {
          action: {
            label: "Coba Lagi",
            onClick: () => this.printText(text)
          },
          duration: 8000
        });
        
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
      return false;
    }
  }
  
  // Specific troubleshooting tips for EcoPrint printers
  getEcoPrintTroubleshootingTips(): string[] {
    return [
      "1. Untuk printer EcoPrint, tekan dan tahan tombol power selama 3-5 detik hingga lampu berkedip BIRU (mode pairing).",
      "2. Lampu hijau/biru tetap (tidak berkedip) berarti printer TIDAK dalam mode pairing.",
      "3. Lampu merah menunjukkan baterai lemah. Isi daya printer terlebih dahulu.",
      "4. Jika lampu tidak menyala sama sekali, cek apakah printer masih memiliki daya.",
      "5. Pastikan printer memiliki kertas thermal yang terpasang dengan benar.",
      "6. Jika printer tidak terdeteksi, reset printer dengan mematikan dan menyalakan lagi.",
      "7. Coba restart aplikasi dan perangkat Android Anda.",
      "8. Hapus perangkat dari pengaturan Bluetooth Android dan coba sambungkan lagi.",
      "9. Jika semua cara gagal, coba sambungkan dengan aplikasi lain seperti 'Bluetooth Printer Tester' untuk memastikan printer berfungsi."
    ];
  }
  
  async isPrinterReady(): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        return false;
      }
      
      // Check if plugin provides direct method
      if (BluetoothPrinter.isPrinterConnected) {
        const status = await BluetoothPrinter.isPrinterConnected();
        if (!status.value) {
          // If not connected, try to reconnect
          return await this.connectToPrinter(this.connectedDevice);
        }
        return true;
      }
      
      // If no direct method, try test connection
      if (BluetoothPrinter.testConnection) {
        const testResult = await BluetoothPrinter.testConnection();
        return testResult.value;
      }
      
      // If no test method either, try reconnecting to ensure connection is still valid
      return await this.connectToPrinter(this.connectedDevice);
    } catch (error) {
      console.error('Error checking printer readiness:', error);
      return false;
    }
  }
}

const BluetoothPrinterService = new BluetoothPrinterServiceClass();
export default BluetoothPrinterService;
