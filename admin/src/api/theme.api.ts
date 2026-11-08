import apiClient from "./apiClient";
import type {
  CreateThemePayload,
  ReplaceThemePayload,
  Theme,
  ThemeListResponse,
  UpdateThemePayload,
} from "../types/theme";

/** Envelope returned by every backend success response. */
interface ApiEnvelope<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

/**
 * Website theme service.
 *
 * All requests go through the shared Axios instance so Bearer tokens,
 * single-flight refresh and error normalisation keep working. Documents are
 * addressed by their stable `_id` so updates never create a duplicate theme.
 */

export const getThemes = async (signal?: AbortSignal): Promise<ThemeListResponse> => {
  const response = await apiClient.get<ApiEnvelope<ThemeListResponse>>("/themes", { signal });
  return response.data.data;
};

export const createTheme = async (payload: CreateThemePayload): Promise<Theme> => {
  const response = await apiClient.post<ApiEnvelope<Theme>>("/themes", payload);
  return response.data.data;
};

/**
 * Whole-document replacement. `expectedVersion` performs an optimistic
 * compare-and-set; the backend answers 409 when the document moved on.
 */
export const replaceTheme = async (
  id: string,
  payload: ReplaceThemePayload,
): Promise<Theme> => {
  const response = await apiClient.put<ApiEnvelope<Theme>>(
    `/themes/${encodeURIComponent(id)}`,
    payload,
  );
  return response.data.data;
};

/** Partial update — activation and token edits both go through PATCH. */
export const patchTheme = async (
  id: string,
  payload: UpdateThemePayload,
): Promise<Theme> => {
  const response = await apiClient.patch<ApiEnvelope<Theme>>(
    `/themes/${encodeURIComponent(id)}`,
    payload,
  );
  return response.data.data;
};

export const deleteTheme = async (id: string): Promise<void> => {
  await apiClient.delete(`/themes/${encodeURIComponent(id)}`);
};
