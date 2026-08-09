import { axiosClient } from "./axiosClient";

export interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string; role: string };
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await axiosClient.post<{ success: true; data: LoginResponse }>("/auth/login", { email, password });
    return res.data.data;
  },
  me: async () => {
    const res = await axiosClient.get("/auth/me");
    return res.data.data;
  },
  logout: async () => {
    await axiosClient.post("/auth/logout");
  },
};
