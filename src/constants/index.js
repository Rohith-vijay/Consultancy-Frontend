// central place for app-wide constants such as routes, configuration keys, etc.
import { getBackendUrl } from "../utils";

export const ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  DONATION: "/donation",
  EVENTS: "/events",
  HISTORY: "/history",
  CONTACT: "/contact",
  VOLUNTEER: "/volunteer",
  VISION: "/vision",
  LOGIN: "/login",
  SIGNUP: "/signup",
  UNAUTHORIZED: "/unauthorized",
  ADMIN: "/admin",
};

export const ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  DONOR: "DONOR",
  VOLUNTEER: "VOLUNTEER",
};

export const APP_NAME = "K.V.G. Shanmuka Sai Charitable Trust";

export const API_BASE_URL = getBackendUrl();
