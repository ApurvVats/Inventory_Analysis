import axios from "axios";

export const route = axios.create({
  baseURL: "http://localhost:4000/api",
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
