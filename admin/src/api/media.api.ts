import apiClient from "./apiClient";
import type { MediaItem, MediaListResponse } from "../types/page";

interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/** Media library listing with server-side paging. */
export const getMedia = async (
  params: { page?: number; limit?: number } = {},
  signal?: AbortSignal,
): Promise<MediaListResponse> => {
  const response = await apiClient.get<ApiEnvelope<MediaListResponse>>("/media", {
    params: { page: params.page ?? 1, limit: params.limit ?? 24 },
    signal,
  });
  return response.data.data;
};

/**
 * Uploads one image. The request interceptor strips the JSON `Content-Type`
 * header for FormData so the browser can set the multipart boundary.
 */
export const uploadMedia = async (
  file: File,
  onUploadProgress?: (percent: number) => void,
): Promise<MediaItem> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<ApiEnvelope<MediaItem>>("/media", formData, {
    timeout: 120000,
    onUploadProgress: (event) => {
      if (!onUploadProgress || !event.total) return;
      onUploadProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    },
  });

  return response.data.data;
};

/** Deletes a media record; the backend refuses (409) while a page still uses it. */
export const deleteMedia = async (id: string): Promise<void> => {
  await apiClient.delete(`/media/${encodeURIComponent(id)}`);
};
