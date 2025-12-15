import React from 'react';

interface GaugeProps {
  value: number;
  max?: number;
}

const Gauge: React.FC<GaugeProps> = ({ value, max = 200 }) => {
  // Clamp value
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;
  
  // Angle calculations for a semi-circle or 3/4 circle
  // Let's do a 240 degree gauge (from +150deg to +390deg)
  const radius = 120;
  const strokeWidth = 24;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  // 240 degrees represents 2/3 of a full circle
  const arcLength = (240 / 360) * circumference; 
  const strokeDashoffset = arcLength - (percentage / 100) * arcLength;

  // Color logic
  let colorClass = "text-primary";
  let statusText = "SAFE";
  
  if (value < 15) {
    colorClass = "text-danger";
    statusText = "CRITICAL";
  } else if (value < 50) {
    colorClass = "text-warning";
    statusText = "WARNING";
  } else {
    colorClass = "text-success";
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      {/* SVG Container */}
      <svg
        height={radius * 2 + 20}
        width={radius * 2 + 20}
        className="transform rotate-[150deg] transition-all duration-300"
      >
        {/* Background Track */}
        <circle
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={radius + 10}
          cy={radius + 10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Progress Bar */}
        <circle
          className={`${colorClass} transition-all duration-500 ease-out`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={normalizedRadius}
          cx={radius + 10}
          cy={radius + 10}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Inner Content (absolute to center it visually unrelated to rotation) */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-4">
        <div className={`text-6xl font-bold font-mono tracking-tighter ${colorClass} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
          {Math.round(value)}
        </div>
        <div className="text-slate-400 text-sm font-semibold mt-1">CM</div>
        <div className={`text-xs font-bold px-2 py-0.5 rounded-full mt-2 bg-slate-800 border border-slate-700 ${colorClass}`}>
          {statusText}
        </div>
      </div>
      
      {/* Min/Max Labels */}
      <div className="absolute bottom-10 w-full flex justify-between px-12 text-slate-500 text-xs font-mono">
        <span>0 CM</span>
        <span>{max}+ CM</span>
      </div>
    </div>
  );
};

export default Gauge;