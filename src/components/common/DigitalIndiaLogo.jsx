import React from 'react';
import digitalIndiaLogo from '../../assets/Digital_India_logo.svg.webp';

const DigitalIndiaLogo = ({
  className = '',
  imgClassName = 'h-10 sm:h-15 w-auto',
  variant = 'color',
  showTagline = true,
  href = 'https://www.digitalindia.gov.in',
  alt = 'Digital India - Power To Empower',
}) => {
  const isWhite = variant === 'white';

  const imageElement = (
    <img
      src={digitalIndiaLogo}
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
        title="Digital India - Power To Empower (digitalindia.gov.in)"
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

export default DigitalIndiaLogo;

