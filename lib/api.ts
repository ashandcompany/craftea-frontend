const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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

  const res = await fetch(`${API_BASE}${path}`, {
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
    request<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/api/auth/me"),
};

// ─── Users ──────────────────────────────────────────────────────────────

export const users = {
  list: () => request<User[]>("/api/users/"),
  get: (id: number) => request<User>(`/api/users/${id}`),
  update: (id: number, data: Partial<Pick<User, "firstname" | "lastname" | "email">>) =>
    request<User>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleActive: (id: number) =>
    request<User>(`/api/users/${id}/toggle-active`, { method: "PATCH" }),
  changeRole: (id: number, role: User["role"]) =>
    request<User>(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
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
  list: () => request<Address[]>("/api/addresses/"),
  create: (data: Omit<Address, "id" | "user_id">) =>
    request<Address>("/api/addresses/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Address>) =>
    request<Address>(`/api/addresses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/addresses/${id}`, { method: "DELETE" }),
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
  stripe_account_id?: string | null;
  stripe_onboarded?: boolean;
  wallet_balance?: number;
  pending_balance?: number;
  shops?: Shop[];
  created_at: string;
}

export interface StripeOnboardingStatus {
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
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

export type ShippingZone = 'france' | 'europe' | 'world';

export interface ShopShippingProfile {
  id: number;
  shop_id: number;
  zone: ShippingZone;
  base_fee: number;
  additional_item_fee: number;
  free_shipping_threshold: number | null;
}

export type DeliveryTimeUnit = 'days' | 'weeks';

export interface ShopShippingMethod {
  id?: number;
  shop_id: number;
  name: string;
  zones: string[];
  delivery_time_min?: number | null;
  delivery_time_max?: number | null;
  delivery_time_unit: DeliveryTimeUnit;
}

export const artists = {
  list: () => request<ArtistProfile[]>("/api/artists/"),
  get: (id: number) => request<ArtistProfile>(`/api/artists/${id}`),
  me: () => request<ArtistProfile>("/api/artists/profile/me"),
  updateMe: (data: Partial<Pick<ArtistProfile, "bio" | "banner_url" | "logo_url" | "social_links">> | FormData) =>
    request<ArtistProfile>("/api/artists/profile/me", {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  create: (data: Partial<ArtistProfile> | FormData) =>
    request<ArtistProfile>("/api/artists/", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  adminListAll: () => request<ArtistProfile[]>("/api/artists/admin/all"),
  toggleValidation: (id: number) =>
    request<ArtistProfile>(`/api/artists/${id}/toggle-validation`, { method: "PATCH" }),
  createStripeOnboardingLink: () =>
    request<{ url: string; stripeAccountId: string }>("/api/artists/profile/me/stripe/onboarding", {
      method: "POST",
    }),
  getStripeOnboardingStatus: () =>
    request<StripeOnboardingStatus>("/api/artists/profile/me/stripe/status"),
};

export const shops = {
  listByArtist: (artistId: number) =>
    request<Shop[]>(`/api/shops/artist/${artistId}`),
  get: (id: number) => request<Shop>(`/api/shops/${id}`),
  create: (data: Pick<Shop, "name" | "description" | "location"> | FormData) =>
    request<Shop>("/api/shops/", {
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  update: (id: number, data: Partial<Pick<Shop, "name" | "description" | "location">> | FormData) =>
    request<Shop>(`/api/shops/${id}`, {
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
  delete: (id: number) =>
    request<void>(`/api/shops/${id}`, { method: "DELETE" }),
  getShipping: (shopId: number) =>
    request<ShopShippingProfile[]>(`/api/shops/${shopId}/shipping`),
  updateShipping: (shopId: number, profiles: Omit<ShopShippingProfile, 'id' | 'shop_id'>[]) =>
    request<ShopShippingProfile[]>(`/api/shops/${shopId}/shipping`, {
      method: "PUT",
      body: JSON.stringify({ profiles }),
    }),
  getShippingBulk: (shopIds: number[]) =>
    request<Record<number, ShopShippingProfile[]>>(`/api/shops/shipping/bulk?ids=${shopIds.join(',')}`),
  getShippingMethods: (shopId: number) =>
    request<ShopShippingMethod[]>(`/api/shops/${shopId}/shipping-methods`),
  updateShippingMethods: (shopId: number, methods: Omit<ShopShippingMethod, 'shop_id'>[]) =>
    request<ShopShippingMethod[]>(`/api/shops/${shopId}/shipping-methods`, {
      method: "PUT",
      body: JSON.stringify({ methods }),
    }),
  getShippingMethodsBulk: (shopIds: number[]) =>
    request<Record<number, ShopShippingMethod[]>>(`/api/shops/shipping-methods/bulk?ids=${shopIds.join(',')}`),
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
  processing_time_min?: number;
  processing_time_max?: number;
  processing_time_unit?: 'days' | 'weeks';
  delivery_time_min?: number;
  delivery_time_max?: number;
  delivery_time_unit?: 'days' | 'weeks';
  shipping_fee?: number | null;
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
    return request<PaginatedProducts>(`/api/products/${query ? `?${query}` : ""}`);
  },
  get: (id: number) => request<Product>(`/api/products/${id}`),
  create: (data: { shop_id: number; category_id?: number; title: string; description?: string; price?: number; stock?: number; processing_time_min?: number; processing_time_max?: number; processing_time_unit?: string; delivery_time_min?: number; delivery_time_max?: number; delivery_time_unit?: string; images?: File[]; tags?: number[] }) => {
    const formData = new FormData();
    formData.append('shop_id', String(data.shop_id));
    if (data.category_id) formData.append('category_id', String(data.category_id));
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', String(data.price));
    if (data.stock !== undefined) formData.append('stock', String(data.stock));
    if (data.processing_time_min !== undefined) formData.append('processing_time_min', String(data.processing_time_min));
    if (data.processing_time_max !== undefined) formData.append('processing_time_max', String(data.processing_time_max));
    if (data.processing_time_unit) formData.append('processing_time_unit', data.processing_time_unit);
    if (data.delivery_time_min !== undefined) formData.append('delivery_time_min', String(data.delivery_time_min));
    if (data.delivery_time_max !== undefined) formData.append('delivery_time_max', String(data.delivery_time_max));
    if (data.delivery_time_unit) formData.append('delivery_time_unit', data.delivery_time_unit);
    if (data.images && data.images.length > 0) {
      data.images.forEach((file) => formData.append('images', file));
    }
    if (data.tags && data.tags.length > 0) {
      formData.append('tags', JSON.stringify(data.tags));
    }
    return request<Product>("/api/products/", { method: "POST", body: formData });
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
    return request<Product>(`/api/products/${id}`, { method: "PUT", body });
  },
  delete: (id: number) =>
    request<void>(`/api/products/${id}`, { method: "DELETE" }),
  updateStock: (id: number, stock: number) =>
    request<Product>(`/api/products/${id}/stock`, { method: "PATCH", body: JSON.stringify({ stock }) }),
  toggleActive: (id: number) =>
    request<Product>(`/api/products/${id}/toggle-active`, { method: "PATCH" }),
};

export const categories = {
  list: () => request<Category[]>("/api/categories/"),
  get: (id: number) => request<Category>(`/api/categories/${id}`),
  create: (data: Pick<Category, "name" | "description">) =>
    request<Category>("/api/categories/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Category>) =>
    request<Category>(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/categories/${id}`, { method: "DELETE" }),
};

export const tags = {
  list: () => request<Tag[]>("/api/tags/"),
  create: (data: { name: string }) =>
    request<Tag>("/api/tags/", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/tags/${id}`, { method: "DELETE" }),
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
    return request<{ data: Favorite[]; total: number }>(`/api/favorites/${query ? `?${query}` : ""}`);
  },
  check: (productId: number) =>
    request<{ isFavorite: boolean }>(`/api/favorites/check/${productId}`),
  add: (product_id: number) =>
    request<Favorite>("/api/favorites/", { method: "POST", body: JSON.stringify({ product_id }) }),
  remove: (productId: number) =>
    request<void>(`/api/favorites/${productId}`, { method: "DELETE" }),
};

export const reviews = {
  listByProduct: (productId: number, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
    const query = qs.toString();
    return request<{ data: Review[]; total: number }>(`/api/reviews/product/${productId}${query ? `?${query}` : ""}`);
  },
  average: (productId: number) =>
    request<{ product_id: number; average: number; count: number }>(`/api/reviews/product/${productId}/average`),
  mine: () => request<{ data: Review[] }>("/api/reviews/me"),
  create: (data: { product_id: number; rating: number; comment?: string }) =>
    request<Review>("/api/reviews/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: { rating?: number; comment?: string }) =>
    request<Review>(`/api/reviews/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<void>(`/api/reviews/${id}`, { method: "DELETE" }),
};

// ─── Orders ─────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  shop_id?: number;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  total: number;
  shipping_total: number;
  shipping_zone?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export const orders = {
  create: (items: { product_id: number; quantity: number; price: number }[], shipping_zone?: string, shop_ids?: number[]) =>
    request<Order>("/api/orders", { method: "POST", body: JSON.stringify({ items, shipping_zone, shop_ids }) }),
  my: () =>
    request<Order[]>("/api/orders/my"),
  artistOrders: () =>
    request<Order[]>("/api/orders/artist/my"),
  list: () =>
    request<Order[]>("/api/orders/"),
  get: (id: number) =>
    request<Order>(`/api/orders/${id}`),
  updateStatus: (id: number, status: OrderStatus) =>
    request<Order>(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ─── Cart ───────────────────────────────────────────────────────────────

export interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
}

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export const cart = {
  get: () =>
    request<Cart>("/api/cart"),
  addItem: (product_id: number, quantity: number = 1) =>
    request<Cart>("/api/cart/items", { method: "POST", body: JSON.stringify({ product_id, quantity }) }),
  updateItem: (itemId: number, quantity: number) =>
    request<Cart>(`/api/cart/items/${itemId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }),
  removeItem: (itemId: number) =>
    request<Cart>(`/api/cart/items/${itemId}`, { method: "DELETE" }),
  clear: () =>
    request<Cart>("/api/cart", { method: "DELETE" }),
};

// ─── Payments ───────────────────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Payment {
  id: number;
  user_id: number;
  order_id?: number;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotency_key: string;
  stripe_payment_intent_id?: string;
  stripe_client_secret?: string;
  stripe_receipt_url?: string;
  error_detail?: string;
  created_at: string;
  updated_at: string;
}

export const payments = {
  /** Create a Stripe PaymentIntent — returns Payment with stripe_client_secret */
  createIntent: (data: { order_id?: number; amount: number; currency?: string }) =>
    request<Payment>("/api/payments/create-intent", { method: "POST", body: JSON.stringify(data) }),
  /** Confirm a payment after Stripe.js card confirmation */
  confirm: (data: { payment_intent_id: string }) =>
    request<Payment>("/api/payments/confirm", { method: "POST", body: JSON.stringify(data) }),
  my: () =>
    request<Payment[]>("/api/payments/my"),
  byOrder: (orderId: number) =>
    request<Payment[]>(`/api/payments/order/${orderId}`),
  get: (id: number) =>
    request<Payment>(`/api/payments/${id}`),
  refund: (id: number, reason?: string) =>
    request<Payment>(`/api/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ reason }) }),
  list: () =>
    request<Payment[]>("/api/payments"),
};
