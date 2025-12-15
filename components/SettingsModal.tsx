import React, { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_DB_URL } from '../types';
import { X, Save, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
  currentSettings: AppSettings;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
  const [apiKey, setApiKey] = useState(currentSettings.firebaseConfig.apiKey);
  const [dbUrl, setDbUrl] = useState(currentSettings.firebaseConfig.databaseURL);
  const [path, setPath] = useState(currentSettings.dataPath);
  const [useRest, setUseRest] = useState(currentSettings.useRestApi);

  useEffect(() => {
    if (isOpen) {
      setApiKey(currentSettings.firebaseConfig.apiKey);
      setDbUrl(currentSettings.firebaseConfig.databaseURL || DEFAULT_DB_URL);
      setPath(currentSettings.dataPath);
      setUseRest(currentSettings.useRestApi);
    }
  }, [isOpen, currentSettings]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firebaseConfig: {
        apiKey,
        databaseURL: dbUrl,
      },
      dataPath: path,
      useRestApi: useRest,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-850">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary">⚙️</span> Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Database URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Database URL</label>
            <input
              type="url"
              required
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="https://your-project.firebaseio.com/"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">The user provided link: <code>{DEFAULT_DB_URL}</code></p>
          </div>

          {/* Data Path */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Variable Path (Node)</label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-slate-500">/</span>
              <input
                type="text"
                required
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="distance"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300">Connection Method</label>
              <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setUseRest(false)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!useRest ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  SDK
                </button>
                <button
                  type="button"
                  onClick={() => setUseRest(true)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${useRest ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  REST
                </button>
              </div>
            </div>

            {!useRest ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">Required for Firebase SDK.</p>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-yellow-500 text-xs">
                 <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                 <p>REST Streaming connects directly to the DB URL without an API Key. This only works if your database rules are set to <code>".read": true</code> (Public).</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-sky-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-sky-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save & Connect
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;