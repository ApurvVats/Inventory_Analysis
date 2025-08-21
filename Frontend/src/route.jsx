import axios from "axios";

export const route = axios.create({
  baseURL: "https://apurv-analytics-app-2025-cwbzbyfgbcbpa6aq.centralindia-01.azurewebsites.net", 
  withCredentials: true,
});
// Optional helper: set/remove token globally
export function setAuthToken(token) {
  if (token) {
    route.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete route.defaults.headers.common.Authorization;
    localStorage.removeItem("token");
  }
}