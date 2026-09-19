import React from 'react';
import atmanirbharLogo from '../../assets/aatmanirbhar bharat.png';

const AtmanirbharLogo = ({
  className = '',
  imgClassName = 'h-9 sm:h-16 w-auto',
  variant = 'color',
  href = 'https://www.makeinindia.com',
  alt = 'Atmanirbhar Bharat - Self-Reliant India',
}) => {
  const isWhite = variant === 'white';

  const imageElement = (
    <img
      src={atmanirbharLogo}
      alt={alt}
      className={`object-contain transition-all duration-200 ${
        isWhite ? 'brightness-0 invert opacity-90 hover:opacity-100' : ''
      } ${imgClassName}`}
      loading="eager"
    />
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center select-none transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-sm ${className}`}
        title="Atmanirbhar Bharat (Self-Reliant India)"
      >
        {imageElement}
      </a>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {imageElement}
    </div>
  );
};

export default AtmanirbharLogo;

