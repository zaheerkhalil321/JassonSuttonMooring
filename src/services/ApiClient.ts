import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Job } from "../types";

export interface LoginRequest {
  loginName: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    accessToken: string;
    user: {
      createdAt: string; // ISO date string
      email: string;
      id: string;
      isActive: boolean;
      location: string;
      loginName: string;
      name: string;
      phone: string;
      role: "SUPER_ADMIN" | "ADMIN" | "USER"; // restrict to known roles if possible
      updatedAt: string; // ISO date string
    };
  };
  message?: string;
  error?: string;
}

export interface UpdateJobRequest {
  status?: number; // 1: Expected, 2: Sail, 3: Ordered
  comments?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: "https://backend.jsmsl.net", // Using your actual API base URL
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Initialize token from storage
    this.initializeToken();

    // Request interceptor to add auth header
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Always check for the latest token before making a request
          if (!this.token) {
            this.token = await this.getStoredToken();
            console.log(
              "Token loaded from storage:",
              this.token ? "Success" : "Not found"
            );
          }

          if (this.token && config.headers) {
            config.headers.Authorization = `Bearer ${this.token}`;
            console.log("✅ Authorization header added to request");
          } else {
            console.log(
              "❌ No token available for request - token:",
              !!this.token
            );
          }
        } catch (error) {
          console.log("❌ Error loading token:", error);
        }

        return config;
      },
      (error: any) => {
        console.log("❌ Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: any) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.log("Token expired or invalid, clearing auth data");
          await this.clearToken();
          // You can emit an event here to redirect to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Initialize token from storage on app start
  private async initializeToken(): Promise<void> {
    try {
      this.token = await this.getStoredToken();
      if (this.token) {
        console.log("Token loaded from storage on app initialization");
      }
    } catch (error) {
      console.error("Failed to initialize token:", error);
    }
  }

  // Allow manually setting token (e.g., after login)
  async setToken(token: string | null, persist: boolean = true): Promise<void> {
    console.log("🚀 ~ ApiClient ~ setToken ~ token:", token)
    try {
      this.token = token;
      // Set default header immediately for subsequent requests in this session
      if (token) {
        (this.client.defaults.headers as any).common =
          (this.client.defaults.headers as any).common || {};
        (
          this.client.defaults.headers as any
        ).common.Authorization = `Bearer ${token}`;
        if (persist) {
          await this.storeToken(token);
        }
      } else {
        // Clear header and storage if token is null
        if ((this.client.defaults.headers as any).common) {
          delete (this.client.defaults.headers as any).common.Authorization;
        }
        await this.clearToken();
      }
    } catch (err) {
      console.error("Error in setToken:", err);
    }
  }

  private async getStoredToken(): Promise<string | null> {
    try {
      // First try to get token with expiration data
      const tokenDataString = await AsyncStorage.getItem("auth_token_data");
      if (tokenDataString) {
        const tokenData = JSON.parse(tokenDataString);
        // Check if token is still valid (within 30 days)
        if (tokenData.expiresAt && Date.now() < tokenData.expiresAt) {
          return tokenData.token;
        } else {
          // Token expired, clear it
          await this.clearToken();
          return null;
        }
      }

      // Fallback to simple token storage (for backward compatibility)
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        // If we find an old token, migrate it to new format
        await this.storeToken(token);
        return token;
      }

      return null;
    } catch (error) {
      console.error("Error getting stored token:", error);
      return null;
    }
  }

  private async storeToken(token: string): Promise<void> {
    try {
      const tokenData = {
        token: token,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
        storedAt: Date.now(),
      };
      await AsyncStorage.setItem("auth_token_data", JSON.stringify(tokenData));
      await AsyncStorage.setItem("auth_token", token); // Keep for backward compatibility
      this.token = token;
    } catch (error) {
      console.error("Error storing token:", error);
    }
  }

  private async clearToken(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(["auth_token", "auth_token_data", "user_data"]);
      this.token = null;
    } catch (error) {
      console.error("Error clearing token:", error);
    }
  }

  // User data storage methods
  private async storeUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem("user_data", JSON.stringify(user));
      console.log("✅ User data stored successfully");
    } catch (error) {
      console.error("❌ Error storing user data:", error);
    }
  }

  async getSavedUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem("user_data");
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error("Error getting saved user:", error);
      return null;
    }
  }

  // Create FormData helper
  private createFormData(data: any): FormData {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key].toString());
      }
    });
    return formData;
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const formData = this.createFormData(credentials);

      const response = await this.client.post<LoginResponse>(
        "/api/auth/staff-login",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success && response.data.data?.token) {
        console.log("✅ Login successful, storing token for 30 days");
        await this.setToken(response.data.data.token, true);
        
        // Store user data if available
        if (response.data.data.user) {
          await this.storeUser(response.data.data.user);
        }
      }

      return response.data;
    } catch (error: any) {
      console.error("❌ Login error:", error);
      return {
        success: false,
        message:
          error.response?.data?.message || "Login failed. Please try again.",
        error: error.response?.data?.error || "LOGIN_FAILED",
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post("/api/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await this.clearToken();
    }
  }

  // Job methods
  async getJobs(): Promise<ApiResponse> {
    try {
      const today = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
      const response = await this.client.get(`/api/jobs?date=${today}`);
      return response.data;
    } catch (error: any) {
      console.error("Get jobs error:", error.response);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch jobs",
      };
    }
  }

  async getJobById(jobId: string): Promise<ApiResponse> {
    console.log("🚀 ~ ApiClient ~ getJobById ~ jobId:", jobId)
    try {
      const response = await this.client.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error: any) {
      console.error("Get job by ID error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch job details",
      };
    }
  }

  async updateJob(jobId: string, data: Job): Promise<ApiResponse> {
    console.log("🚀 ~ ApiClient ~ updateJob ~ data:", data)
    try {
      const formData = this.createFormData(data);
      console.log("🚀 ~ ApiClient ~ updateJob ~ formData:", formData)

      const response = await this.client.put(`/api/jobs/${jobId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Update job error:", error.response);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update job",
      };
    }
  }

  async deleteJob(jobId: string): Promise<ApiResponse> {
    try {
      const response = await this.client.delete(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error: any) {
      console.error("Delete job error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete job",
      };
    }
  }

  // Check if user is authenticated (enhanced version)
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return false;
      }

      // Set the token for future requests
      this.token = token;

      // Optionally verify token with server
      // For now, just check if token exists and is not expired
      return true;
    } catch (error) {
      console.error("Authentication check error:", error);
      return false;
    }
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
