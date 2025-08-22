import axios from "axios";

export const route = axios.create({
  baseURL: "https://apurv-analytics-app-2025-cwbzbyfgbcbpa6aq.centralindia-01.azurewebsites.net", 
  withCredentials: true,
});
route.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Optional: auto-logout on 401
route.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      // e.g., window.location.assign('/login');
    }
    return Promise.reject(err);
  }
);
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