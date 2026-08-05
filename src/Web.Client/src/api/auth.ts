import { apiClient } from "./client";
import type { AccessTokensResponse, LoginRequest, RegisterRequest, UserResponse } from "./types";

export const authApi = {
  login: async (payload: LoginRequest): Promise<AccessTokensResponse> => {
    const { data } = await apiClient.post<AccessTokensResponse>("/users/login", payload);
    return data;
  },

  register: async (payload: RegisterRequest): Promise<string> => {
    const { data } = await apiClient.post<string>("/users/register", payload);
    return data;
  },

  getById: async (userId: string): Promise<UserResponse> => {
    const { data } = await apiClient.get<UserResponse>(`/users/${userId}`);
    return data;
  },
};
