import React from 'react';

const NicLogo = ({ className = "h-6 sm:h-7" }) => {
  return (
    <a
      href="https://www.nic.in"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-sm"
      title="National Informatics Centre (Govt. of India)"
    >
      <img
        src="/nic-logo.png"
        alt="National Informatics Centre"
        className={`w-auto object-contain ${className}`}
        loading="eager"
      />
    </a>
  );
};

export default NicLogo;
