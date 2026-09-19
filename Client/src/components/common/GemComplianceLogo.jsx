import React from 'react';
import logoGem from '../../assets/logo_gem.png';

const GemComplianceLogo = ({ className = '', imgClassName = 'h-10 w-auto' }) => {
  return (
    <div className={`flex items-center select-none ${className}`}>
      <img
        src={logoGem} 
        alt="GeM Compliflix — AI Powered Compliance Platform"
        className={`object-contain ${imgClassName}`}
      />
    </div>
  );
};

export default GemComplianceLogo;
