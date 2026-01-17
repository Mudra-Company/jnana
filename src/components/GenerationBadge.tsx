import React from 'react';
import { 
  getGeneration, 
  getGenerationFromAge, 
  calculateAge,
  GENERATION_COLORS, 
  GENERATION_LABELS,
  type GenerationType 
} from '../../services/generationService';

interface GenerationBadgeProps {
  birthDate?: string | null;
  age?: number | null;
  showAge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const GenerationBadge: React.FC<GenerationBadgeProps> = ({
  birthDate,
  age,
  showAge = false,
  size = 'sm',
  className = ''
}) => {
  // Determine generation - prioritize birthDate
  let generation: GenerationType | null = null;
  let displayAge: number | null = null;
  
  if (birthDate) {
    generation = getGeneration(birthDate);
    displayAge = calculateAge(birthDate);
  } else if (age !== undefined && age !== null) {
    generation = getGenerationFromAge(age);
    displayAge = age;
  }
  
  if (!generation) {
    return null;
  }
  
  const colors = GENERATION_COLORS[generation];
  const label = GENERATION_LABELS[generation];
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  return (
    <span 
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
        ${className}
      `}
      title={`${label.full} (${label.years})`}
    >
      {label.short}
      {showAge && displayAge !== null && (
        <span className="opacity-70">• {displayAge}y</span>
      )}
    </span>
  );
};

// Compact version for inline use
export const GenerationTag: React.FC<{
  birthDate?: string | null;
  age?: number | null;
}> = ({ birthDate, age }) => {
  let generation: GenerationType | null = null;
  
  if (birthDate) {
    generation = getGeneration(birthDate);
  } else if (age !== undefined && age !== null) {
    generation = getGenerationFromAge(age);
  }
  
  if (!generation) return null;
  
  const colors = GENERATION_COLORS[generation];
  const label = GENERATION_LABELS[generation];
  
  return (
    <span 
      className={`text-xs font-semibold ${colors.text}`}
      title={`${label.full} (${label.years})`}
    >
      {label.short}
    </span>
  );
};
