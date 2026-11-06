import apiClient from "./apiClient";

export interface Glimpse {
  _id: string;
  user_id: string;
  image_url: string;
  public_id: string;
  order: number;
}

interface ApiListResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const getGlimpses = async (signal?: AbortSignal): Promise<Glimpse[]> => {
  const response = await apiClient.get<
    ApiListResponse<{ total: number; items: Glimpse[] }>
  >("/glimpses", { signal });
  return response.data.data.items;
};

export interface UploadGlimpsesResult {
  items: Glimpse[];
  message: string;
}

/**
 * Uploads 1–5 images as multipart/form-data (field name: `images`).
 * Uploads get a longer timeout than regular API calls.
 */
export const uploadGlimpses = async (
  files: File[],
  onUploadProgress?: (percent: number) => void,
): Promise<UploadGlimpsesResult> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await apiClient.post<ApiListResponse<Glimpse[]>>(
    "/glimpses",
    formData,
    {
      timeout: 120000,
      onUploadProgress: (event) => {
        if (onUploadProgress && event.total) {
          onUploadProgress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
        }
      },
    },
  );

  return { items: response.data.data, message: response.data.message };
};

export const deleteGlimpse = async (id: string): Promise<void> => {
  await apiClient.delete(`/glimpses/${id}`);
};
