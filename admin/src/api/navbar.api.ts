import apiClient from "./apiClient";

export interface SubNavItem {
  _id: string;
  parent_item: string;
  item_name: string;
  page_content: string;
  item_type: "navItem" | "gallery";
  order: number;
}

export interface NavbarItem {
  _id: string;
  user_id: string;
  item_name: string;
  order: number;
  sub_items: SubNavItem[];
}

interface ApiListResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export const getNavbars = async (
  signal?: AbortSignal,
): Promise<NavbarItem[]> => {
  const response = await apiClient.get<ApiListResponse<NavbarItem[]>>(
    "/navbars",
    { signal },
  );
  return response.data.data;
};

export interface CreateNavbarPayload {
  items: { item_name: string; order?: number }[];
  user_id: string;
}

export const createNavbars = async (
  payload: CreateNavbarPayload,
): Promise<NavbarItem[]> => {
  const response = await apiClient.post<ApiListResponse<NavbarItem[]>>(
    "/navbars",
    payload,
  );
  return response.data.data;
};

export interface UpdateNavbarPayload {
  item_name: string;
  order: number;
}

export const updateNavbar = async (
  navbarId: string,
  payload: UpdateNavbarPayload,
): Promise<NavbarItem> => {
  const response = await apiClient.put<ApiListResponse<NavbarItem>>(
    `/navbars/${navbarId}`,
    payload,
  );
  return response.data.data;
};

export const deleteNavbar = async (navbarId: string): Promise<void> => {
  await apiClient.delete(`/navbars/${navbarId}`);
};

export interface CreateSubNavItemPayload {
  sub_items: {
    item_name: string;
    page_content: string;
    item_type: "navItem" | "gallery";
    order?: number;
  }[];
}

export const createSubNavItems = async (
  navbarId: string,
  payload: CreateSubNavItemPayload,
): Promise<SubNavItem[]> => {
  const response = await apiClient.post<ApiListResponse<SubNavItem[]>>(
    `/navbars/${navbarId}/subnavbars`,
    payload,
  );
  return response.data.data;
};

export interface UpdateSubNavItemPayload {
  item_name: string;
  page_content: string;
  item_type: "navItem" | "gallery";
  order: number;
}

export const updateSubNavItem = async (
  subnavId: string,
  payload: UpdateSubNavItemPayload,
): Promise<SubNavItem> => {
  const response = await apiClient.put<ApiListResponse<SubNavItem>>(
    `/subnavbars/${subnavId}`,
    payload,
  );
  return response.data.data;
};

export const deleteSubNavItem = async (subnavId: string): Promise<void> => {
  await apiClient.delete(`/subnavbars/${subnavId}`);
};
