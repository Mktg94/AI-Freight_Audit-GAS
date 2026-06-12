import React from 'react';

interface ConfidenceBarProps {
  score: number;
  showLabel?: boolean;
}

export default function ConfidenceBar({ score, showLabel = false }: ConfidenceBarProps) {
  const clampedScore = Math.max(0, Math.min(1, score));
  const roundedPercent = Math.round(clampedScore * 100);

  let barColorClass = 'bg-red-400';
  if (clampedScore >= 0.8) {
    barColorClass = 'bg-indigo-500';
  } else if (clampedScore >= 0.6) {
    barColorClass = 'bg-amber-400';
  }

  return (
    <div className="w-full flex flex-col gap-1" id="confidence-bar-wrapper">
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
          style={{ width: `${roundedPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-gray-400 font-mono">
          {roundedPercent}% confident
        </span>
      )}
    </div>
  );
}
