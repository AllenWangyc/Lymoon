// src/lib/apiBase.ts
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_BASE) {
    return process.env.EXPO_PUBLIC_API_BASE;
  }
  if (__DEV__) {
    const debuggerHost = Constants.expoGoConfig?.debuggerHost;
    if (debuggerHost) {
      const host = debuggerHost.split(':')[0];
      return `http://${host}:5253/api`;
    }
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:5253/api'
      : 'http://localhost:5253/api';
  }
  return 'http://localhost:5253/api';
}

export const API_BASE = resolveApiBase();
