import apiClient from "./apiClient";
import type { CreatePagePayload, Page, ReplacePagePayload } from "../types/page";

/** Envelope returned by every backend success response. */
interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/**
 * Page document service.
 *
 * All requests go through the shared Axios instance so Bearer tokens,
 * single-flight refresh and error normalisation keep working. Documents are
 * always addressed by their stable `_id` (or slug) so updates never create a
 * duplicate page.
 */

export const getPages = async (signal?: AbortSignal): Promise<Page[]> => {
  const response = await apiClient.get<ApiEnvelope<Page[]>>("/pages", { signal });
  return response.data.data;
};

export const getPage = async (slugOrId: string, signal?: AbortSignal): Promise<Page> => {
  const response = await apiClient.get<ApiEnvelope<Page>>(
    `/pages/${encodeURIComponent(slugOrId)}`,
    { signal },
  );
  return response.data.data;
};

export const createPage = async (payload: CreatePagePayload): Promise<Page> => {
  const response = await apiClient.post<ApiEnvelope<Page>>("/pages", payload);
  return response.data.data;
};

/**
 * Whole-document replacement. `expectedVersion` performs an optimistic
 * compare-and-set; the backend answers 409 when the document moved on.
 */
export const replacePage = async (
  id: string,
  payload: ReplacePagePayload,
): Promise<Page> => {
  const response = await apiClient.put<ApiEnvelope<Page>>(
    `/pages/${encodeURIComponent(id)}`,
    payload,
  );
  return response.data.data;
};

export const deletePage = async (id: string): Promise<void> => {
  await apiClient.delete(`/pages/${encodeURIComponent(id)}`);
};
