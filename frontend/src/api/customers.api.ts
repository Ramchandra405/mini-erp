import { axiosClient } from "./axiosClient";

export const customersApi = {
  list: async (params: Record<string, string | undefined>) => {
    const res = await axiosClient.get("/customers", { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await axiosClient.get(`/customers/${id}`);
    return res.data.data;
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await axiosClient.post("/customers", payload);
    return res.data.data;
  },
  update: async (id: string, payload: Record<string, unknown>) => {
    const res = await axiosClient.put(`/customers/${id}`, payload);
    return res.data.data;
  },
  deactivate: async (id: string) => {
    const res = await axiosClient.delete(`/customers/${id}`);
    return res.data.data;
  },
  listFollowUps: async (id: string, params: Record<string, string | undefined>) => {
    const res = await axiosClient.get(`/customers/${id}/followups`, { params });
    return res.data.data;
  },
  createFollowUp: async (id: string, payload: { note: string; followUpDate?: string }) => {
    const res = await axiosClient.post(`/customers/${id}/followups`, payload);
    return res.data.data;
  },
};
