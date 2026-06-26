/**
 * In-memory mock database for Playwright E2E tests.
 * Replaces real backend calls so tests run without a running backend.
 */

import { SignJWT } from 'jose';

export type Role = 'buyer' | 'artist' | 'admin';

export interface MockUser {
  id: number;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface MockArtistProfile {
  id: number;
  user_id: number;
  bio: string;
  banner_url?: string;
  logo_url?: string;
  social_links?: string;
  validated: boolean;
  validation_status: 'none' | 'pending' | 'approved' | 'rejected';
  stripe_account_id: string | null;
  stripe_onboarded: boolean;
  wallet_balance: number;
  pending_balance: number;
  created_at: string;
}

export interface MockShop {
  id: number;
  artist_id: number;
  name: string;
  description: string;
  location: string;
  banner_url?: string;
  logo_url?: string;
  created_at: string;
}

export interface MockProduct {
  id: number;
  shop_id: number;
  artist_id: number;
  category_id?: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  is_active: boolean;
  created_at: string;
}

export interface MockCartItem {
  user_id: number;
  product_id: number;
  quantity: number;
}

export interface MockOrder {
  id: number;
  buyer_id: number;
  status: string;
  total: number;
  items: Array<{ product_id: number; quantity: number; price: number }>;
  shop_ids: number[];
  created_at: string;
}

class MockDatabase {
  private users: MockUser[] = [];
  private artistProfiles: MockArtistProfile[] = [];
  private shops: MockShop[] = [];
  private products: MockProduct[] = [];
  private cartItems: Map<number, MockCartItem[]> = new Map();
  private orders: MockOrder[] = [];

  private counters = { user: 100, profile: 100, shop: 100, product: 100, order: 100 };

  reset() {
    this.users = [];
    this.artistProfiles = [];
    this.shops = [];
    this.products = [];
    this.cartItems = new Map();
    this.orders = [];
    this.counters = { user: 100, profile: 100, shop: 100, product: 100, order: 100 };
  }

  // ── Users ────────────────────────────────────────────────────────────────

  ensureUser(data: Omit<MockUser, 'id' | 'is_active' | 'created_at'>): MockUser {
    let user = this.users.find((u) => u.email === data.email);
    if (!user) {
      user = {
        id: ++this.counters.user,
        is_active: true,
        created_at: new Date().toISOString(),
        ...data,
      };
      this.users.push(user);
    }
    return user;
  }

  findUserByEmail(email: string): MockUser | undefined {
    return this.users.find((u) => u.email === email);
  }

  findUserById(id: number): MockUser | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserFromToken(token: string): MockUser | undefined {
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        if (typeof payload.id === 'number') return this.findUserById(payload.id);
      } catch {
        // fall through
      }
    }
    return undefined;
  }

  async authenticate(email: string, password: string): Promise<{ accessToken: string; refreshToken: string; user: MockUser }> {
    const user = this.findUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error(`Mock auth failed for ${email}`);
    }
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? 'ci-test-jwt-secret-32chars-min!!'
    );
    const accessToken = await new SignJWT({ id: user.id, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);
    const refreshToken = await new SignJWT({ id: user.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);
    return { accessToken, refreshToken, user };
  }

  // ── Artist Profiles ──────────────────────────────────────────────────────

  upsertArtistProfile(userId: number, data: Partial<Omit<MockArtistProfile, 'id' | 'user_id' | 'created_at'>>): MockArtistProfile {
    let profile = this.artistProfiles.find((p) => p.user_id === userId);
    if (!profile) {
      profile = {
        id: ++this.counters.profile,
        user_id: userId,
        bio: '',
        validated: false,
        validation_status: 'none',
        stripe_account_id: null,
        stripe_onboarded: false,
        wallet_balance: 0,
        pending_balance: 0,
        created_at: new Date().toISOString(),
        ...data,
      };
      this.artistProfiles.push(profile);
    } else {
      Object.assign(profile, data);
    }
    return profile;
  }

  findArtistProfileByUserId(userId: number): MockArtistProfile | undefined {
    return this.artistProfiles.find((p) => p.user_id === userId);
  }

  /** Returns a profile DTO including its shops (for /api/artists/profile/me) */
  getArtistProfileWithShops(userId: number): (MockArtistProfile & { shops: MockShop[] }) | undefined {
    const profile = this.findArtistProfileByUserId(userId);
    if (!profile) return undefined;
    const shops = this.shops.filter((s) => s.artist_id === userId);
    return { ...profile, shops };
  }

  // ── Shops ────────────────────────────────────────────────────────────────

  createShop(data: Omit<MockShop, 'id' | 'created_at'>): MockShop {
    const shop: MockShop = {
      id: ++this.counters.shop,
      created_at: new Date().toISOString(),
      ...data,
    };
    this.shops.push(shop);
    return shop;
  }

  findShopById(id: number): MockShop | undefined {
    return this.shops.find((s) => s.id === id);
  }

  listShopsByArtist(artistId: number): MockShop[] {
    return this.shops.filter((s) => s.artist_id === artistId);
  }

  // ── Products ─────────────────────────────────────────────────────────────

  createProduct(data: Omit<MockProduct, 'id' | 'created_at'>): MockProduct {
    const product: MockProduct = {
      id: ++this.counters.product,
      created_at: new Date().toISOString(),
      ...data,
    };
    this.products.push(product);
    return product;
  }

  findProductById(id: number): MockProduct | undefined {
    return this.products.find((p) => p.id === id);
  }

  findProductByTitle(title: string): MockProduct | undefined {
    const lc = title.toLowerCase();
    return this.products.find((p) => p.title.toLowerCase().includes(lc));
  }

  listProducts(params: { shop_id?: number; search?: string; include_inactive?: boolean } = {}): MockProduct[] {
    return this.products.filter((p) => {
      if (!params.include_inactive && !p.is_active) return false;
      if (params.shop_id && p.shop_id !== params.shop_id) return false;
      if (params.search && !p.title.toLowerCase().includes(params.search.toLowerCase())) return false;
      return true;
    });
  }

  updateProduct(id: number, data: Partial<MockProduct>): MockProduct | undefined {
    const product = this.products.find((p) => p.id === id);
    if (product) Object.assign(product, data);
    return product;
  }

  // ── Cart ─────────────────────────────────────────────────────────────────

  getCart(userId: number): MockCartItem[] {
    return this.cartItems.get(userId) ?? [];
  }

  clearCart(userId: number): void {
    this.cartItems.set(userId, []);
  }

  addToCart(userId: number, productId: number, quantity: number): MockCartItem[] {
    const items = this.getCart(userId);
    const existing = items.find((i) => i.product_id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      items.push({ user_id: userId, product_id: productId, quantity });
    }
    this.cartItems.set(userId, items);
    return items;
  }

  // ── Orders ───────────────────────────────────────────────────────────────

  createOrder(buyerId: number, product: MockProduct): MockOrder {
    const order: MockOrder = {
      id: ++this.counters.order,
      buyer_id: buyerId,
      status: 'pending',
      total: Number(product.price),
      items: [{ product_id: product.id, quantity: 1, price: Number(product.price) }],
      shop_ids: [product.shop_id],
      created_at: new Date().toISOString(),
    };
    this.orders.push(order);
    this.updateProduct(product.id, { stock: Math.max(0, product.stock - 1) });
    return order;
  }

  findOrderById(id: number): MockOrder | undefined {
    return this.orders.find((o) => o.id === id);
  }

  listOrdersByBuyer(buyerId: number): MockOrder[] {
    return this.orders.filter((o) => o.buyer_id === buyerId);
  }
}

export const mockDb = new MockDatabase();
