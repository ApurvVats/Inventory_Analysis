import axios from "axios";

export const route = axios.create({
  baseURL: "https://witty-pond-0c0668400.2.azurestaticapps.net", 
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