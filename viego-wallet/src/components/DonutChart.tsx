"use client";

import React from 'react';

type Slice = {
  label: string;
  value: number;
  color: string; // CSS color value (e.g., #10b981)
};

interface Props {
  data: Slice[];
  size?: number; // px
  stroke?: number; // px
  centerLabel?: string;
  centerSubLabel?: string;
}

export default function DonutChart({ data, size = 180, stroke = 18, centerLabel, centerSubLabel }: Props) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* background ring FIRST so slices render on top */}
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="transparent"
          strokeWidth={stroke}
          stroke="#e5e7eb"
          opacity={0.25}
        />
        <g transform={`rotate(-90 ${size/2} ${size/2})`}>
          {data.map((slice, idx) => {
            const fraction = slice.value / total;
            const dash = circumference * fraction;
            const gap = circumference - dash;
            const strokeDasharray = `${dash} ${gap}`;
            const strokeDashoffset = -circumference * cumulative;
            cumulative += fraction;
            return (
              <circle
                key={idx}
                cx={size/2}
                cy={size/2}
                r={radius}
                fill="transparent"
                strokeWidth={stroke}
                strokeLinecap="butt"
                stroke={slice.color}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
        </g>
      </svg>
      {(centerLabel || centerSubLabel) && (
        <div className="absolute text-center">
          {centerLabel && <div className="text-2xl font-bold text-gray-900">{centerLabel}</div>}
          {centerSubLabel && <div className="text-sm text-gray-500">{centerSubLabel}</div>}
        </div>
      )}
    </div>
  );
}

