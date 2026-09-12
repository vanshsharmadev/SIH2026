import React from 'react';
import satyamevLogoDark from '../../assets/college_logo_002.png';

/**
 * Responsive National Emblem of India component with automatic Light / Dark theme switching.
 * - Light Theme: Uses official SVG emblem (/emblem.svg)
 * - Dark Theme: Uses high-contrast Satyamev Jayate white outline emblem (college_logo_002.png)
 */
const NationalEmblem = ({
  className = 'h-9 sm:h-10 w-auto object-contain',
  alt = 'National Emblem of India - Satyamev Jayate',
  style = {},
  variant = 'auto', // 'auto' | 'dark-only' | 'light-only'
}) => {
  if (variant === 'dark-only') {
    return (
      <img
        src={satyamevLogoDark}
        alt={alt}
        style={style}
        className={`${className} object-contain shrink-0`}
      />
    );
  }

  if (variant === 'light-only') {
    return (
      <img
        src="/emblem.svg"
        alt={alt}
        style={style}
        className={`${className} object-contain shrink-0`}
      />
    );
  }

  return (
    <>
      {/* Light Theme Emblem */}
      <img
        src="/emblem.svg"
        alt={alt}
        style={style}
        className={`${className} object-contain shrink-0 drop-shadow-2xs dark:hidden`}
      />
      {/* Dark Theme Satyamev Jayate Emblem */}
      <img
        src={satyamevLogoDark}
        alt={alt}
        style={style}
        className={`${className} object-contain shrink-0 drop-shadow-sm hidden dark:block`}
      />
    </>
  );
};

export default NationalEmblem;
