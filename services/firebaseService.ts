import { initializeApp, getApps, deleteApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database } from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: Database | undefined;
let eventSource: EventSource | undefined;

// Cleanup function to remove listeners and instances
export const disconnectFirebase = () => {
  if (db) {
    // We can't easily "unmount" the db instance but we can stop listeners in the component
    // In a real app we might want to goOffline(db);
  }
  
  if (app) {
    deleteApp(app).catch(console.error);
    app = undefined;
    db = undefined;
  }

  if (eventSource) {
    eventSource.close();
    eventSource = undefined;
  }
};

// Initialize Standard SDK Connection
export const connectFirebaseSDK = (
  config: FirebaseConfig, 
  path: string, 
  onData: (val: number) => void,
  onError: (err: string) => void
) => {
  try {
    disconnectFirebase(); // Ensure clean slate

    // Basic validation
    if (!config.apiKey || !config.databaseURL) {
      throw new Error("API Key and Database URL are required for SDK mode.");
    }

    app = initializeApp(config);
    db = getDatabase(app);
    
    const starCountRef = ref(db, path);
    onValue(starCountRef, (snapshot) => {
      const data = snapshot.val();
      if (typeof data === 'number') {
        onData(data);
      } else if (data && typeof data === 'object') {
        // Try to find a numeric value if the path points to an object
        const firstKey = Object.keys(data)[0];
        if (firstKey && typeof data[firstKey] === 'number') {
           onData(data[firstKey]);
        }
      } else if (typeof data === 'string') {
          const parsed = parseFloat(data);
          if (!isNaN(parsed)) onData(parsed);
      }
    }, (error) => {
      onError(error.message);
    });

    return true;
  } catch (error: any) {
    onError(error.message || "Unknown Firebase Error");
    return false;
  }
};

// Initialize REST Streaming (EventSource) for public/open DBs
export const connectFirebaseREST = (
  databaseURL: string,
  path: string,
  onData: (val: number) => void,
  onError: (err: string) => void,
  onOpen: () => void
) => {
  disconnectFirebase();

  // Normalize URL
  let cleanUrl = databaseURL.endsWith('/') ? databaseURL.slice(0, -1) : databaseURL;
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // Construct REST Streaming URL
  const url = `${cleanUrl}${cleanPath}.json?ns=${cleanUrl.split('//')[1].split('.')[0]}`; // simple namespace guess or just .json

  // Actually, for firebaseio.com, just .json is usually enough if public
  const streamUrl = `${cleanUrl}${cleanPath}.json`;

  try {
    eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      onOpen();
    };

    eventSource.addEventListener('put', (e: MessageEvent) => {
      try {
        const parsed = JSON.parse(e.data);
        const data = parsed.data;
        if (typeof data === 'number') {
          onData(data);
        } else if (typeof data === 'string') {
             const num = parseFloat(data);
             if(!isNaN(num)) onData(num);
        }
      } catch (err) {
        console.error("Parse error", err);
      }
    });

    eventSource.addEventListener('patch', (e: MessageEvent) => {
       // Handle partial updates if necessary, usually 'put' covers the main value update
       try {
        const parsed = JSON.parse(e.data);
        const data = parsed.data;
        // If the path itself is a number, data is the number
        if (typeof data === 'number') onData(data);
       } catch(err) {}
    });

    eventSource.onerror = (err) => {
      // EventSource doesn't give detailed error info
      onError("Connection lost or access denied (REST). Check URL and Rules.");
      eventSource?.close();
    };

    return true;
  } catch (error: any) {
    onError(error.message || "Failed to setup EventSource");
    return false;
  }
};