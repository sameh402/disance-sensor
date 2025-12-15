import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  Activity, 
  PlayCircle, 
  StopCircle,
  Zap
} from 'lucide-react';
import Gauge from './components/Gauge';
import HistoryChart from './components/HistoryChart';
import SettingsModal from './components/SettingsModal';
import { AppSettings, ConnectionStatus, DEFAULT_DB_URL, DistanceRecord } from './types';
import { connectFirebaseSDK, connectFirebaseREST, disconnectFirebase } from './services/firebaseService';

// Default initial settings
const INITIAL_SETTINGS: AppSettings = {
  firebaseConfig: {
    apiKey: '', // User needs to provide this for SDK
    databaseURL: DEFAULT_DB_URL,
  },
  dataPath: 'distance',
  useRestApi: true // Default to REST for ease of use with provided public link
};

const App: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [distance, setDistance] = useState<number>(0);
  const [history, setHistory] = useState<DistanceRecord[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Refs for demo mode intervals
  const demoIntervalRef = useRef<number | null>(null);

  // Manage History Array
  const addHistoryRecord = useCallback((val: number) => {
    setHistory(prev => {
      const newRecord = { timestamp: Date.now(), value: val };
      const newHistory = [...prev, newRecord];
      // Keep last 60 points
      if (newHistory.length > 60) return newHistory.slice(newHistory.length - 60);
      return newHistory;
    });
  }, []);

  // Handle incoming data
  const handleDataUpdate = useCallback((val: number) => {
    setDistance(val);
    addHistoryRecord(val);
    setStatus(ConnectionStatus.CONNECTED);
  }, [addHistoryRecord]);

  const handleConnectionError = useCallback((err: string) => {
    console.error(err);
    setStatus(ConnectionStatus.ERROR);
  }, []);

  const startDemo = () => {
    setStatus(ConnectionStatus.DEMO);
    setIsDemoMode(true);
    disconnectFirebase();
    
    let t = 0;
    if (demoIntervalRef.current) window.clearInterval(demoIntervalRef.current);
    
    demoIntervalRef.current = window.setInterval(() => {
      t += 0.1;
      // Simulate erratic sensor data
      const noise = Math.random() * 5;
      const val = 100 + Math.sin(t) * 80 + noise; 
      handleDataUpdate(val);
    }, 200);
  };

  const stopDemo = useCallback(() => {
    if (demoIntervalRef.current) {
      window.clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsDemoMode(false);
    setStatus(ConnectionStatus.DISCONNECTED);
    setHistory([]);
    setDistance(0);
  }, []);

  const connect = useCallback(() => {
    if (isDemoMode) stopDemo();
    
    setStatus(ConnectionStatus.CONNECTING);
    setHistory([]);

    if (settings.useRestApi) {
      // Use REST Streaming (EventSource)
      const success = connectFirebaseREST(
        settings.firebaseConfig.databaseURL,
        settings.dataPath,
        handleDataUpdate,
        handleConnectionError,
        () => setStatus(ConnectionStatus.CONNECTED)
      );
      if (!success) setStatus(ConnectionStatus.ERROR);
    } else {
      // Use SDK
      if (!settings.firebaseConfig.apiKey) {
        setStatus(ConnectionStatus.ERROR);
        alert("API Key is required for SDK mode. Please check settings.");
        return;
      }
      const success = connectFirebaseSDK(
        settings.firebaseConfig,
        settings.dataPath,
        handleDataUpdate,
        handleConnectionError
      );
      if (!success) setStatus(ConnectionStatus.ERROR);
    }
  }, [settings, isDemoMode, stopDemo, handleDataUpdate, handleConnectionError]);

  // Initial connection attempt on mount
  useEffect(() => {
    connect();
    return () => {
      disconnectFirebase();
      if (demoIntervalRef.current) window.clearInterval(demoIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Re-connect when settings change (handled by modal save)
  const handleSettingsSave = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // The effect dependency on 'settings' isn't used to prevent loops, we call connect explicitly
    setTimeout(() => connect(), 100); 
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-primary selection:text-white pb-10">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-lg text-primary border border-primary/20">
              <Zap size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Sonic<span className="text-primary">Sight</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Ultrasonic Telemetry</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              status === ConnectionStatus.CONNECTED ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              status === ConnectionStatus.DEMO ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
              status === ConnectionStatus.CONNECTING ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
              'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              {status === ConnectionStatus.CONNECTED ? <Wifi size={14} /> : <WifiOff size={14} />}
              {status}
            </div>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Gauge & Status */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-2xl relative overflow-hidden">
             {/* Decorative grid background */}
             <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
             
             <div className="relative z-10 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold text-slate-400 flex items-center gap-2">
                    <Activity size={16} /> Live Distance
                  </h2>
                  <div className="text-xs font-mono text-slate-600">ID: NODE-MCU-01</div>
                </div>
                
                <Gauge value={distance} max={200} />

                <div className="grid grid-cols-2 gap-4 w-full mt-6">
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold">Signal</div>
                    <div className="text-emerald-400 font-mono text-lg">Good</div>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                    <div className="text-xs text-slate-500 uppercase font-bold">Latency</div>
                    <div className="text-primary font-mono text-lg">~45ms</div>
                  </div>
                </div>
             </div>
          </div>

          {/* Action Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col items-center justify-center text-center gap-4">
            <p className="text-sm text-slate-400">
              {isDemoMode ? "Simulating sensor data." : "Waiting for realtime data from Firebase."}
            </p>
            {!isDemoMode ? (
              <button 
                onClick={startDemo}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                <PlayCircle size={16} /> Simulate Data
              </button>
            ) : (
              <button 
                onClick={connect}
                className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-red-500/25"
              >
                <StopCircle size={16} /> Stop Simulation
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Charts & Logs */}
        <div className="lg:col-span-7 space-y-6">
          <HistoryChart data={history} />
          
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex-1 min-h-[300px]">
             <h3 className="text-slate-400 text-sm font-semibold mb-4 border-b border-slate-800 pb-2">Recent Events</h3>
             <div className="space-y-2 overflow-y-auto max-h-[250px] pr-2 font-mono text-xs">
               {history.length === 0 && <div className="text-slate-600 italic">No data received yet...</div>}
               {[...history].reverse().map((record, idx) => (
                 <div key={record.timestamp} className="flex justify-between items-center p-2 rounded hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-0">
                   <span className="text-slate-500">{new Date(record.timestamp).toLocaleTimeString()}</span>
                   <span className={record.value < 15 ? 'text-danger' : 'text-primary'}>
                     {record.value.toFixed(2)} cm
                   </span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={handleSettingsSave}
        currentSettings={settings}
      />
    </div>
  );
};

export default App;