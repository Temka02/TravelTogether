import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";
import type {
  AuthResponse,
  RefreshResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Trip,
  Application,
  ApiResponse,
  TripFilters,
  ProfileUpdateRequest,
  PaginatedResponse,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiClient {
  private client: AxiosInstance;
  private refreshTokenPromise: Promise<string> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - добавляем access token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor - обработка 401 и автообновление токена
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = "/login";
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  // Token management
  private getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.refreshTokenPromise) {
      return this.refreshTokenPromise;
    }

    this.refreshTokenPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await axios.post<RefreshResponse>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      this.refreshTokenPromise = null;
      return accessToken;
    })();

    return this.refreshTokenPromise;
  }

  // Auth API
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
      data: User;
    }>("/auth/register", data);
    this.setTokens(response.data.accessToken, response.data.refreshToken);
    return {
      success: response.data.success,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.data,
    };
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<{
      success: boolean;
      accessToken: string;
      refreshToken: string;
      data: User;
    }>("/auth/login", data);

    this.setTokens(response.data.accessToken, response.data.refreshToken);

    return {
      success: response.data.success,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      user: response.data.data,
    };
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      await this.client.post("/auth/logout", { refreshToken });
    }
    this.clearTokens();
  }

  async getMe(): Promise<ApiResponse<User>> {
    const response = await this.client.get<{ success: boolean; data: User }>(
      "/auth/me",
    );
    return {
      success: response.data.success,
      data: response.data.data,
    };
  }

  async updateProfile(data: ProfileUpdateRequest): Promise<ApiResponse<User>> {
    const response = await this.client.put<{ success: boolean; user: User }>(
      "/auth/update-profile",
      data,
    );
    return {
      success: response.data.success,
      data: response.data.user,
    };
  }

  async getAvatar(): Promise<{ success: boolean; avatarUrl: string | null }> {
    const response = await this.client.get<{
      success: boolean;
      avatarUrl: string | null;
    }>("/auth/avatar");
    return response.data;
  }

  async uploadAvatar(
    file: File,
  ): Promise<{ success: boolean; avatarUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await this.client.post<{
      success: boolean;
      avatarUrl: string;
    }>("/auth/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  // Trips API
  async getTrips(
    filters?: TripFilters & {
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    },
  ): Promise<PaginatedResponse<Trip>> {
    const response = await this.client.get<PaginatedResponse<Trip>>("/trips", {
      params: filters,
    });
    return response.data;
  }

  async getTripById(id: string): Promise<ApiResponse<Trip>> {
    const response = await this.client.get<ApiResponse<Trip>>(`/trips/${id}`);
    return response.data;
  }

  async createTrip(data: Partial<Trip>): Promise<ApiResponse<Trip>> {
    const response = await this.client.post<ApiResponse<Trip>>("/trips", data);
    return response.data;
  }

  async updateTrip(
    id: string,
    data: Partial<Trip>,
  ): Promise<ApiResponse<Trip>> {
    const response = await this.client.put<ApiResponse<Trip>>(
      `/trips/${id}`,
      data,
    );
    return response.data;
  }

  async deleteTrip(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/trips/${id}`,
    );
    return response.data;
  }

  async getTripParticipants(tripId: string): Promise<ApiResponse<User[]>> {
    const response = await this.client.get<ApiResponse<User[]>>(
      `/trips/${tripId}/participants`,
    );
    return response.data;
  }

  async getTripApplications(
    tripId: string,
  ): Promise<ApiResponse<{ pending: Application[]; rejected: Application[] }>> {
    const response = await this.client.get<
      ApiResponse<{ pending: Application[]; rejected: Application[] }>
    >(`/trips/${tripId}/applications`);
    return response.data;
  }

  // Applications API
  async createApplication(
    tripId: string,
    message?: string,
  ): Promise<ApiResponse<Application>> {
    const response = await this.client.post<ApiResponse<Application>>(
      "/applications",
      {
        tripId,
        message,
      },
    );
    return response.data;
  }

  async acceptApplication(id: string): Promise<ApiResponse<Application>> {
    const response = await this.client.put<ApiResponse<Application>>(
      `/applications/${id}/accept`,
    );
    return response.data;
  }

  async rejectApplication(id: string): Promise<ApiResponse<Application>> {
    const response = await this.client.put<ApiResponse<Application>>(
      `/applications/${id}/reject`,
    );
    return response.data;
  }

  async getMyApplications(): Promise<ApiResponse<Application[]>> {
    const response =
      await this.client.get<ApiResponse<Application[]>>("/applications/my");
    return response.data;
  }

  async getApplicationsToMyTrips(): Promise<ApiResponse<Application[]>> {
    const response = await this.client.get<ApiResponse<Application[]>>(
      "/applications/to-my-trips",
    );
    return response.data;
  }

  async checkApplication(
    tripId: string,
  ): Promise<ApiResponse<Application | null>> {
    const response = await this.client.get<ApiResponse<Application | null>>(
      `/applications/check/${tripId}`,
    );
    return response.data;
  }

  async deleteApplication(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/applications/${id}`,
    );
    return response.data;
  }

  // Admin API (опционально)
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await this.client.get<ApiResponse<User[]>>("/admin/users");
    return response.data;
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    const response = await this.client.get<ApiResponse<User>>(
      `/admin/users/${id}`,
    );
    return response.data;
  }

  async updateUser(
    id: string,
    data: Partial<User>,
  ): Promise<ApiResponse<User>> {
    const response = await this.client.put<ApiResponse<User>>(
      `/admin/users/${id}`,
      data,
    );
    return response.data;
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(
      `/admin/users/${id}`,
    );
    return response.data;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async getWeather(city: string): Promise<
    ApiResponse<{
      temp: number;
      description: string;
      icon: string;
      city: string;
    }>
  > {
    const response = await this.client.get(
      `/weather/${encodeURIComponent(city)}`,
    );
    return response.data;
  }
}

export { ApiClient };
export const apiClient = new ApiClient();
