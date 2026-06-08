import React from 'react';

interface ConfidenceBarProps {
  score: number; // 0.0 to 1.0
  showLabel?: boolean;
}

export default function ConfidenceBar({ score, showLabel = false }: ConfidenceBarProps) {
  // Clamp score between 0 and 1
  const clampedScore = Math.max(0, Math.min(1, score));
  const roundedPercent = Math.round(clampedScore * 100);

  // Fill color selector
  let barColorClass = 'bg-[#EF4444]'; // Danger red
  if (clampedScore >= 0.8) {
    barColorClass = 'bg-[#2DD4BF] shadow-[0_0_8px_rgba(45,212,191,0.5)]'; // Teal savings
  } else if (clampedScore >= 0.6) {
    barColorClass = 'bg-[#F59E0B]'; // Warning amber
  }

  return (
    <div className="w-full flex flex-col gap-1.5" id="confidence-bar-wrapper">
      <div className="w-full h-1.5 bg-[#1F2D45] rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
          style={{ width: `${roundedPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-[#94A3B8] font-mono tracking-wide uppercase">
          {roundedPercent}% confident
        </span>
      )}
    </div>
  );
}
