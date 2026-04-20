import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tokokita.app',
  appName: 'TokoPintar',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
