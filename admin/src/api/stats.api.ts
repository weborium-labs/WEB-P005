import apiClient from "./apiClient";
import type { OverviewStats } from "../types/page";

interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/** Dashboard statistics — real counts from the database, never fabricated. */
export const getOverviewStats = async (signal?: AbortSignal): Promise<OverviewStats> => {
  const response = await apiClient.get<ApiEnvelope<OverviewStats>>("/stats/overview", {
    signal,
  });
  return response.data.data;
};
