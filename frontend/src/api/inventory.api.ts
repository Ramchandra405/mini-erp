import { axiosClient } from "./axiosClient";

export const inventoryApi = {
  summary: async () => {
    const res = await axiosClient.get("/inventory");
    return res.data.data;
  },
  listMovements: async (params: Record<string, string | undefined>) => {
    const res = await axiosClient.get("/inventory/movements", { params });
    return res.data.data;
  },
  createMovement: async (payload: Record<string, unknown>) => {
    const res = await axiosClient.post("/inventory/movements", payload);
    return res.data.data;
  },
};
