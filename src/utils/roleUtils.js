/**
 * Utility functions for user role determination and access control
 */

export const isOfficerUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const designation = (user.designation || '').toLowerCase();
  const email = (user.email || '').toLowerCase();

  // Commercial Bidder / Vendor identities must NEVER be treated as officers
  if (role.includes('bidder') || role.includes('vendor') || designation.includes('vendor')) {
    return false;
  }

  // Check official government domains and officer roles
  return (
    role === 'procurement officer' ||
    role === 'govt official' ||
    role === 'compliance administrator' ||
    role.includes('officer') ||
    role.includes('admin') ||
    designation.includes('officer') ||
    designation.includes('under secretary') ||
    email.endsWith('.gov.in') ||
    email.endsWith('.nic.in')
  );
};

export const isBidderUser = (user) => {
  if (!user) return false;
  return !isOfficerUser(user);
};

export const getUserDisplayName = (user) => {
  if (!user) return 'Guest User';
  if (user.name && user.name.length > 1 && user.name !== 'OFFICIAL USER') {
    return user.name;
  }
  if (user.email) {
    const raw = user.email.split('@')[0].replace(/[._-]/g, ' ');
    return raw
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return 'Registered User';
};

export const getUserDisplayRole = (user) => {
  if (!user) return 'Guest';
  if (user.role) return user.role;
  return isOfficerUser(user) ? 'Procurement Officer' : 'Procurement Bidder';
};
