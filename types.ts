export interface FirebaseConfig {
  apiKey: string;
  databaseURL: string;
  projectId?: string;
  appId?: string;
}

export interface AppSettings {
  firebaseConfig: FirebaseConfig;
  dataPath: string; // e.g., 'distance'
  useRestApi: boolean; // Option to use REST Streaming for public DBs without API Key
}

export interface DistanceRecord {
  timestamp: number;
  value: number;
}

export enum ConnectionStatus {
  DISCONNECTED = 'Disconnected',
  CONNECTING = 'Connecting',
  CONNECTED = 'Connected',
  ERROR = 'Error',
  DEMO = 'Simulation Mode'
}

export const DEFAULT_DB_URL = "https://rc-robot-car-default-rtdb.firebaseio.com/";