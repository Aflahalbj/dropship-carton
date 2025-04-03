
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.3b19d3c7910e4f0ea66d44ee09fa7eea',
  appName: 'dropship-carton',
  webDir: 'dist',
  server: {
    url: 'https://3b19d3c7-910e-4f0e-a66d-44ee09fa7eea.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
    }
  }
};

export default config;
