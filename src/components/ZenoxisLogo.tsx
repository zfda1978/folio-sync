import React from 'react';

interface AxisMarkProps {
  className?: string;
  variant?: 'dark' | 'light';
}

/**
 * ZENOXIS Emblem — The Axis of Intelligence
 * Faceted isometric Z prism crafted in Ion Violet (#8174D5), Intelligence Blue (#3978E8),
 * and Discovery Teal (#51BCA6), inspired by the user's geometric emblem brief.
 */
export const AxisOfIntelligenceMark: React.FC<AxisMarkProps> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 43 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Bar: Ion Violet & Intelligence Blue Facets */}
      <polygon points="14,5 24,5 19,15 9,15" fill="#8174D5" />
      <polygon points="24,5 34,5 29,15 19,15" fill="#3978E8" />
      {/* Subtle geometric bevel crease on top right */}
      <polygon points="24,5 27.5,5 19,15" fill="#6356B8" fillOpacity="0.35" />

      {/* Middle Axis: Discovery Teal Core & Lateral Discovery Wings */}
      <polygon points="9,15 14,25 4,25" fill="#51BCA6" />
      <polygon points="19,15 29,15 24,25 14,25" fill="#51BCA6" />
      <polygon points="29,15 39,15 34,25" fill="#51BCA6" fillOpacity="0.9" />

      {/* Bottom Bar: Intelligence Blue & Ion Violet Facets */}
      <polygon points="14,25 24,25 19,35 9,35" fill="#3978E8" />
      <polygon points="24,25 34,25 29,35 19,35" fill="#8174D5" />
      {/* Subtle geometric bevel crease on bottom right */}
      <polygon points="24,25 19,35 22.5,35" fill="#5A4BB3" fillOpacity="0.45" />
    </svg>
  );
};

export const ZenoxisWordmark: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'light' }) => {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <AxisOfIntelligenceMark className="w-7 h-7 shrink-0" variant={variant} />
      <span
        className={`font-['Sora'] text-base font-bold tracking-[0.16em] uppercase ${
          variant === 'light' ? 'text-[#111D3B]' : 'text-[#EDF1FA]'
        }`}
      >
        ZENOXIS
      </span>
    </div>
  );
};
