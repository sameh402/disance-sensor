import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DistanceRecord } from '../types';

interface HistoryChartProps {
  data: DistanceRecord[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-xl text-xs">
        <p className="text-slate-300">{`Time: ${new Date(label).toLocaleTimeString()}`}</p>
        <p className="text-primary font-bold">{`Distance: ${payload[0].value} cm`}</p>
      </div>
    );
  }
  return null;
};

const HistoryChart: React.FC<HistoryChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 bg-slate-850/50 rounded-xl p-4 border border-slate-800 backdrop-blur-sm">
      <h3 className="text-slate-400 text-sm font-semibold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        Live Sensor Trend
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="timestamp" 
            tick={false} 
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12}
            domain={[0, (dataMax: number) => Math.max(dataMax + 20, 100)]}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#38bdf8' }}
            animationDuration={300}
            isAnimationActive={false} // Disable detailed animation for smoother realtime updates
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoryChart;