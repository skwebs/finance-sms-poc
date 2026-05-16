import { requireNativeModule } from 'expo-modules-core';

const ExpoSmsReader = requireNativeModule('ExpoSmsReader');

export interface SMS {
  _id: string;
  address: string;
  body: string;
  date: number;
  read: number;
  type: number;
  thread_id: number;
}

export interface SmsFilter {
  maxCount?: number;
}

export async function getSms(filter: SmsFilter = {}): Promise<SMS[]> {
  try {
    return await ExpoSmsReader.getSms(filter);
  } catch (error) {
    console.error('Failed to get SMS:', error);
    throw error;
  }
}
