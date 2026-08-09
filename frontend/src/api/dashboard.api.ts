import { axiosClient } from "./axiosClient";

export const dashboardApi = {
  summary: async () => {
    const res = await axiosClient.get("/dashboard/summary");
    return res.data.data;
  },
};
