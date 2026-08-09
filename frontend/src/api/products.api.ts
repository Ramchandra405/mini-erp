import { axiosClient } from "./axiosClient";

export const productsApi = {
  list: async (params: Record<string, string | undefined>) => {
    const res = await axiosClient.get("/products", { params });
    return res.data.data;
  },
  getById: async (id: string) => {
    const res = await axiosClient.get(`/products/${id}`);
    return res.data.data;
  },
  create: async (payload: Record<string, unknown>) => {
    const res = await axiosClient.post("/products", payload);
    return res.data.data;
  },
  update: async (id: string, payload: Record<string, unknown>) => {
    const res = await axiosClient.put(`/products/${id}`, payload);
    return res.data.data;
  },
  deactivate: async (id: string) => {
    const res = await axiosClient.delete(`/products/${id}`);
    return res.data.data;
  },
};
