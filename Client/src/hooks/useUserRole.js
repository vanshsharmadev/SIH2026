import { useAuth } from './useAuth';
import { isOfficerUser, isBidderUser, getUserDisplayName, getUserDisplayRole } from '../utils/roleUtils';

export const useUserRole = () => {
  const { user, isAuthenticated, loading } = useAuth();

  const isOfficer = Boolean(isAuthenticated && isOfficerUser(user));
  const isBidder = Boolean(isAuthenticated && isBidderUser(user));
  const displayName = getUserDisplayName(user);
  const displayRole = getUserDisplayRole(user);

  return {
    user,
    isAuthenticated,
    loading,
    isOfficer,
    isBidder,
    displayName,
    displayRole,
  };
};

export default useUserRole;
