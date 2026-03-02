const API_URLS = {
  user: process.env.NEXT_PUBLIC_USER_API || "http://localhost:3001",
  artist: process.env.NEXT_PUBLIC_ARTIST_API || "http://localhost:3002",
  catalog: process.env.NEXT_PUBLIC_CATALOG_API || "http://localhost:3003",
  interaction: process.env.NEXT_PUBLIC_INTERACTION_API || "http://localhost:3004",
  order: process.env.NEXT_PUBLIC_ORDER_API || "https://localhost:3005",
  cart: process.env.NEXT_PUBLIC_CART_API || "https://localhost:3006",
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function removeToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function request<T>(
  base: keyof typeof API_URLS,
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URLS[base]}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || body.error || res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
  }
}

// ─── Auth ───────────────────────────────────────────────────────────────

export interface User {
  id: number;
  role: "buyer" | "artist" | "admin";
  firstname: string;
  lastname: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const auth = {
  register: (data: { firstname: string; lastname: string; email: string; password: string }) =>
    request<AuthResponse>("user", "/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("user", "/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("user", "/api/auth/me"),
};

// ─── Users ──────────────────────────────────────────────────────────────

export const users = {
  list: () => request<User[]>("user", "/api/users/"),
  get: (id: number) => request<User>("user", `/api/users/${id}`),
  update: (id: number, data: Partial<Pick<User, "firstname" | "lastname" | "email">>) =>
    request<User>("user", `/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleActive: (id: number) =>
    request<User>("user", `/api/users/${id}/toggle-active`, { method: "PATCH" }),
  changeRole: (id: number, role: User["role"]) =>
    request<User>("user", `/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
};

// ─── Addresses ──────────────────────────────────────────────────────────

export interface Address {
  id: number;
  user_id: number;
  label?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}

export const addresses = {
  list: () => request<Address[]>("user", "/api/addresses/"),
  create: (data: Omit<Address, "id" | "user_id">) =>
    request<Address>("user", "/api/addresses/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Address>) =>
    request<Address>("user", `/api/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>("user", `/api/addresses/${id}`, { method: "DELETE" }),
};

// ─── Artists ────────────────────────────────────────────────────────────

export interface ArtistUser {
  id: number;
  firstname: string;
  lastname: string;
}

export interface ArtistProfile {
  id: number;
  user_id: number;
  user?: ArtistUser;
  bio?: string;
  banner_url?: string;
  logo_url?: string;
  social_links?: string;
  validated: boolean;
  shops?: Shop[];
  created_at: string;
}

export interface Shop {
  id: number;
  artist_id: number;
  name?: string;
  description?: string;
  location?: string;
  banner_url?: string;
  logo_url?: string;
  artist?: ArtistProfile;
  created_at: string;
  updated_at: string;
}

export const artists = {
  list: () => request<ArtistProfile[]>("artist", "/api/artists/"),
  get: (id: number) => request<ArtistProfile>("artist", `/api/artists/${id}`),
  me: () => request<ArtistProfile>("artist", "/api/artists/profile/me"),
  updateMe: (data: Partial<Pick<ArtistProfile, "bio" | "banner_url" | "logo_url" | "social_links">> | FormData) =>
    request<ArtistProfile>("artist", "/api/artists/profile/me", {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  create: (data: Partial<ArtistProfile> | FormData) =>
    request<ArtistProfile>("artist", "/api/artists/", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
};

export const shops = {
  listByArtist: (artistId: number) =>
    request<Shop[]>("artist", `/api/shops/artist/${artistId}`),
  get: (id: number) => request<Shop>("artist", `/api/shops/${id}`),
  create: (data: Pick<Shop, "name" | "description" | "location"> | FormData) =>
    request<Shop>("artist", "/api/shops/", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Pick<Shop, "name" | "description" | "location">> | FormData) =>
    request<Shop>("artist", `/api/shops/${id}`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>("artist", `/api/shops/${id}`, { method: "DELETE" }),
};

// ─── Catalog ────────────────────────────────────────────────────────────

export interface Product {
  id: number;
  shop_id: number;
  category_id?: number;
  title?: string;
  description?: string;
  price?: number;
  stock: number;
  is_active: boolean;
  creation_time?: number;
  delivery_time?: number;
  images?: ProductImage[];
  tags?: Tag[];
  category?: Category;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url?: string;
  position?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface PaginatedProducts {
  total: number;
  page: number;
  limit: number;
  data: Product[];
}

export const products = {
  list: (params?: { category_id?: number; tag?: string; search?: string; shop_id?: number; page?: number; limit?: number; include_inactive?: boolean }) => {
    const qs = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
      });
    }
    const query = qs.toString();
    return request<PaginatedProducts>("catalog", `/api/products/${query ? `?${query}` : ""}`);
  },
  get: (id: number) => request<Product>("catalog", `/api/products/${id}`),
  create: (data: { shop_id: number; category_id?: number; title: string; description?: string; price?: number; stock?: number; creation_time?: number; delivery_time?: number; images?: File[]; tags?: number[] }) => {
    const formData = new FormData();
    formData.append('shop_id', String(data.shop_id));
    if (data.category_id) formData.append('category_id', String(data.category_id));
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.stock !== undefined) formData.append('stock', String(data.stock));
    if (data.creation_time !== undefined) formData.append('creation_time', String(data.creation_time));
    if (data.delivery_time !== undefined) formData.append('delivery_time', String(data.delivery_time));
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => formData.append('images', file));
    }
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    return request<Product>("catalog", "/api/products/", { method: "POST", body: formData });
  },
  update: (id: number, data: Partial<Product & { images?: File[]; tags?: number[]; images_to_delete?: number[]; image_order?: number[] }>) => {
    const body = data instanceof FormData ? data : (() => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'images' && Array.isArray(value)) {
          (value as File[]).forEach((file) => formData.append('images', file));
        } else if (key === 'tags' && Array.isArray(value)) {
          formData.append('tags', JSON.stringify(value));
        } else if (key === 'images_to_delete' && Array.isArray(value)) {
          formData.append('images_to_delete', JSON.stringify(value));
        } else if (key === 'image_order' && Array.isArray(value)) {
          formData.append('image_order', JSON.stringify(value));
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      return formData;
    })();
    return request<Product>("catalog", `/api/products/${id}`, { method: "PUT", body });
  },
  delete: (id: number) =>
    request<void>("catalog", `/api/products/${id}`, { method: "DELETE" }),
  updateStock: (id: number, stock: number) =>
    request<Product>("catalog", `/api/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  toggleActive: (id: number) =>
    request<Product>("catalog", `/api/products/${id}/toggle-active`, { method: "PATCH" }),
};

export const categories = {
  list: () => request<Category[]>("catalog", "/api/categories/"),
  get: (id: number) => request<Category>("catalog", `/api/categories/${id}`),
  create: (data: Pick<Category, "name" | "description">) =>
    request<Category>("catalog", "/api/categories/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Category>) =>
    request<Category>("catalog", `/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>("catalog", `/api/categories/${id}`, { method: "DELETE" }),
};

export const tags = {
  list: () => request<Tag[]>("catalog", "/api/tags/"),
  create: (data: { name: string }) =>
    request<Tag>("catalog", "/api/tags/", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>("catalog", `/api/tags/${id}`, { method: "DELETE" }),
};

// ─── Interactions ───────────────────────────────────────────────────────

export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  created_at: string;
}

export interface Review {
  id: number;
  user_id: number;
  product_id: number;
  rating: number;
  comment?: string;
  reviewer_name?: string | null;
  created_at: string;
}

export const favorites = {
  list: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    const query = qs.toString();
    return request<{ data: Favorite[]; total: number }>("interaction", `/api/favorites/${query ? `?${query}` : ""}`);
  },
  check: (productId: number) =>
    request<{ isFavorite: boolean }>("interaction", `/api/favorites/check/${productId}`),
  add: (product_id: number) =>
    request<Favorite>("interaction", "/api/favorites/", { method: "POST", body: JSON.stringify({ product_id }) }),
  remove: (productId: number) =>
    request<void>("interaction", `/api/favorites/${productId}`, { method: "DELETE" }),
};

export const reviews = {
  listByProduct: (productId: number, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    const query = qs.toString();
    return request<{ data: Review[]; total: number }>("interaction", `/api/reviews/product/${productId}${query ? `?${query}` : ""}`);
  },
  average: (productId: number) =>
    request<{ product_id: number; average: number; count: number }>("interaction", `/api/reviews/product/${productId}/average`),
  mine: () => request<{ data: Review[] }>("interaction", "/api/reviews/me"),
  create: (data: { product_id: number; rating: number; comment?: string }) =>
    request<Review>("interaction", "/api/reviews/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { rating?: number; comment?: string }) =>
    request<Review>("interaction", `/api/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>("interaction", `/api/reviews/${id}`, { method: "DELETE" }),
};
