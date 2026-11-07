export interface SubNavItem {
  _id?: string;
  label: string;
  slug?: string;
  path?: string;
  href?: string;
  order?: number;
}

export interface NavItem {
  _id?: string;
  label: string;
  href?: string;
  slug?: string;
  path?: string;
  heading?: string;
  isDropdown?: boolean;
  children?: SubNavItem[];
  subItems?: SubNavItem[];
  order?: number;
}

export interface PageContentItem {
  _id?: string;
  title: string;
  description?: string;
  link?: string;
  order?: number;
}

export interface CustomPageData {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  items: PageContentItem[];
}