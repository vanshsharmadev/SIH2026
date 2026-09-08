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

