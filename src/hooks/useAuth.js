import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { ROLES } from "../utils/permissions";

/**
 * Auth hook with role-based convenience helpers
 */
export const useAuth = () => {
  const { user, isAuthenticated, login, register, logout, oauthLogin } = useContext(AppContext);

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    oauthLogin,

    // Role convenience checks
    isAdmin: user?.role === ROLES.ADMIN,
    isVolunteer: user?.role === ROLES.VOLUNTEER,
    isUser: user?.role === ROLES.USER || user?.role === ROLES.DONOR,

    // Generic role check
    hasRole: (role) => user?.role === role,
  };
};
