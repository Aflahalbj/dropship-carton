
import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

/**
 * This file provides compatibility for plugins that use outdated Capacitor APIs
 */

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
export const createPluginProxy = (name: string) => {
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
    // Use a dynamic import to prevent bundling issues
    return registerPlugin(name);
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
