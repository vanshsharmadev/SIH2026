/**
 * Utility functions for user role determination and access control
 */

export const isOfficerUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  const designation = (user.designation || '').toLowerCase();
  const email = (user.email || '').toLowerCase();

  // Commercial Bidder / Vendor identities check first
  if (
    role.includes('bidder') ||
    (role.includes('vendor') && !role.includes('officer')) ||
    Boolean(user.gstNumber || user.gstin || user.legalName || user.companyName)
  ) {
    return false;
  }

  // Project owner / admin / official account access
  if (email.includes('officer') || email.includes('admin') || email.includes('pwd.gov') || email.includes('gem.gov')) {
    return true;
  }

  // Check official government domains and officer roles
  return (
    role === 'procurement officer' ||
    role === 'govt official' ||
    role === 'evaluating officer' ||
    role === 'compliance administrator' ||
    role.includes('officer') ||
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
