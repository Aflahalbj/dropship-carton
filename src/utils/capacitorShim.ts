
import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

/**
 * This file provides compatibility for plugins that use outdated Capacitor APIs
 */

// Define plugin interfaces for type safety
interface BluetoothPrinterPluginInterface {
  initialize: () => Promise<{ value: boolean }>;
  scan: (options?: { scanDuration?: number }) => Promise<{ value: boolean, devices?: Array<{ address: string, name: string }> }>;
  connect: (options: { address: string }) => Promise<{ value: boolean }>;
  disconnect: () => Promise<{ value: boolean }>;
  print: (options: { text: string }) => Promise<{ value: boolean }>;
}

// Create a compatibility layer for old plugins using registerWebPlugin
export function registerWebPluginShim(plugin: any) {
  // In Capacitor 7+, registerWebPlugin is not needed, but
  // the plugin might try to use it. This empty function prevents runtime errors.
  console.log('Using compatibility shim for Capacitor plugin:', plugin);
  return plugin;
}

// Function to safely initialize a plugin that may use outdated APIs
export function safeRegisterPlugin(name: string, plugin: any) {
  try {
    return registerPlugin(name, plugin);
  } catch (error) {
    console.error('Error registering plugin:', error);
    // Return the plugin as fallback
    return plugin;
  }
}

// Mock implementation of registerWebPlugin for compatibility
(window as any).registerWebPlugin = registerWebPluginShim;

// Create a proxy for BluetoothPrinter to avoid direct import issues
export const createPluginProxy = (name: string): BluetoothPrinterPluginInterface => {
  // Only initialize on native platforms
  if (!Capacitor.isNativePlatform()) {
    console.log(`${name} plugin is only available on native platforms.`);
    // Return mock implementation for web
    return {
      initialize: async () => ({ value: false }),
      scan: async () => ({ value: false, devices: [] }),
      connect: async () => ({ value: false }),
      disconnect: async () => ({ value: false }),
      print: async () => ({ value: false })
    };
  }
  
  try {
    // Try to use the plugin on native platforms
    const plugin = registerPlugin(name) as any;
    
    // Return a wrapped plugin that handles potential implementation issues
    return {
      initialize: async () => {
        try {
          return await plugin.initialize();
        } catch (error) {
          console.error(`${name}.initialize() failed:`, error);
          return { value: false };
        }
      },
      scan: async (options?: any) => {
        try {
          return await plugin.scan(options);
        } catch (error) {
          console.error(`${name}.scan() failed:`, error);
          return { value: false, devices: [] };
        }
      },
      connect: async (options: any) => {
        try {
          return await plugin.connect(options);
        } catch (error) {
          console.error(`${name}.connect() failed:`, error);
          return { value: false };
        }
      },
      disconnect: async () => {
        try {
          return await plugin.disconnect();
        } catch (error) {
          console.error(`${name}.disconnect() failed:`, error);
          return { value: false };
        }
      },
      print: async (options: any) => {
        try {
          return await plugin.print(options);
        } catch (error) {
          console.error(`${name}.print() failed:`, error);
          return { value: false };
        }
      }
    };
  } catch (error) {
    console.error(`Failed to initialize ${name} plugin:`, error);
    // Return mock implementation as fallback
    return {
      initialize: async () => ({ value: false }),
      scan: async () => ({ value: false, devices: [] }),
      connect: async () => ({ value: false }),
      disconnect: async () => ({ value: false }),
      print: async () => ({ value: false })
    };
  }
};
