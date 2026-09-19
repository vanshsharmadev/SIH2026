// Format Indian Rupees (INR)
export const formatCurrencyINR = (amount) => {
  if (isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format date to Indian standard (DD/MM/YYYY or DD MMM YYYY)
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// Check if tender is closed / expired / archived
export const isTenderClosed = (tender) => {
  if (!tender) return false;
  const status = (tender.status || '').toLowerCase().trim();
  return (
    status === 'closed' ||
    status === 'bidding closed' ||
    status === 'archived' ||
    status === 'cancelled' ||
    status === 'expired' ||
    tender.daysLeft === 'Closed' ||
    tender.daysLeft === '0 days' ||
    tender.isClosed === true
  );
};

// Format Indian Rupees into compact Lakhs / Crores (e.g. ₹4.38 Cr or ₹45.50 Lakh)
export const formatIndianLakhCrore = (amount) => {
  if (amount === null || amount === undefined) return '₹0';
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]+/g, ''));
  if (isNaN(numeric) || numeric === 0) return '₹0';

  if (Math.abs(numeric) >= 10000000) {
    const cr = numeric / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (Math.abs(numeric) >= 100000) {
    const lakh = numeric / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} Lakh`;
  }
  return formatCurrencyINR(numeric);
};

