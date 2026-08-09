import { axiosClient } from "./axiosClient";

export const usersApi = {
  list: async (params: Record<string, string | undefined>) => {
    const res = await axiosClient.get("/users", { params });
    return res.data.data;
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await axiosClient.post("/users", payload);
    return res.data.data;
  },
  update: async (id: string, payload: Record<string, unknown>) => {
    const res = await axiosClient.put(`/users/${id}`, payload);
    return res.data.data;
  },
  deactivate: async (id: string) => {
    const res = await axiosClient.patch(`/users/${id}/deactivate`);
    return res.data.data;
  },
};
