import { axiosClient } from "./axiosClient";

export const challansApi = {
  list: async (params: Record<string, string | undefined>) => {
    const res = await axiosClient.get("/challans", { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await axiosClient.get(`/challans/${id}`);
    return res.data.data;
  },
  create: async (payload: { customerId: string; items: { productId: string; quantity: number }[] }) => {
    const res = await axiosClient.post("/challans", payload);
    return res.data.data;
  },
  update: async (id: string, payload: Record<string, unknown>) => {
    const res = await axiosClient.put(`/challans/${id}`, payload);
    return res.data.data;
  },
  confirm: async (id: string) => {
    const res = await axiosClient.post(`/challans/${id}/confirm`);
    return res.data.data;
  },
  cancel: async (id: string) => {
    const res = await axiosClient.post(`/challans/${id}/cancel`);
    return res.data.data;
  },
};
