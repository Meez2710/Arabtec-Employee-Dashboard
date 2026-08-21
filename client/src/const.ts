export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/** Standalone login lives inside this application; no external identity service is required. */
export const startLogin = () => {
  window.location.href = "/login";
};
