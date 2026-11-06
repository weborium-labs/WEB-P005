import apiClient from "./apiClient";

export type PublicationType = "journal" | "conference";

export interface Publication {
  _id: string;
  user_id: string;
  type: PublicationType;
  title: string;
  year: number;
  publication_name: string;
  volume_issue: string;
  indexing: string;
  redirect_url: string;
  order: number;
}

interface ApiListResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const getPublications = async (
  signal?: AbortSignal,
): Promise<Publication[]> => {
  const response = await apiClient.get<
    ApiListResponse<{ total: number; items: Publication[] }>
  >("/publications", { signal });
  return response.data.data.items;
};

export interface PublicationPayload {
  type: PublicationType;
  title: string;
  year: number;
  publication_name: string;
  redirect_url: string;
  volume_issue?: string;
  indexing?: string;
  order?: number;
  user_id?: string;
}

export const createPublications = async (
  payload: PublicationPayload,
): Promise<Publication[]> => {
  const response = await apiClient.post<ApiListResponse<Publication[]>>(
    "/publications",
    { publications: [payload] },
  );
  return response.data.data;
};

export const updatePublication = async (
  id: string,
  payload: PublicationPayload,
): Promise<Publication> => {
  const response = await apiClient.put<ApiListResponse<Publication>>(
    `/publications/${id}`,
    payload,
  );
  return response.data.data;
};

export const deletePublication = async (id: string): Promise<void> => {
  await apiClient.delete(`/publications/${id}`);
};
