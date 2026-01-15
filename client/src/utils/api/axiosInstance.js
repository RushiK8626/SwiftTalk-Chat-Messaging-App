/**
 * Axios Instance with automatic token refresh
 * Handles 401 errors by refreshing the access token and retrying the request
 */

import axios from "axios";
import { handleSessionExpiry } from "../auth/auth";

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          handleSessionExpiry();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken: String(refreshToken) }
        );

        const { accessToken, user } = response.data;
        localStorage.setItem("accessToken", accessToken);

        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        handleSessionExpiry();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
