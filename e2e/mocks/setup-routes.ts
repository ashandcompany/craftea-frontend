/**
 * Playwright route handlers that intercept all backend API calls
 * and respond with data from the in-memory mock database.
 *
 * Call `setupMockRoutes(page)` once per page (or use the custom fixture).
 * All handlers match `http://localhost:3001/**` – the NEXT_PUBLIC_API_URL default.
 */

import type { Page, Route } from '@playwright/test';
import { mockDb } from './mock-db';

// ── Helpers ──────────────────────────────────────────────────────────────────

const API_ORIGIN = 'http://localhost:3001';

/** Decode user ID from a token (JWT payload decode, no verification needed in mocks). */
function decodeTokenUserId(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return typeof payload.id === 'number' ? payload.id : null;
  } catch {
    return null;
  }
}

/** Parse `accessToken=<jwt>` from the Cookie header. */
function userFromCookies(route: Route) {
  const cookieHeader = route.request().headers()['cookie'] ?? '';
  const match = cookieHeader.match(/accessToken=([^;]+)/);
  if (!match) return undefined;
  const userId = decodeTokenUserId(match[1]);
  if (userId === null) return undefined;
  return mockDb.findUserById(userId);
}

/** Parse `Authorization: Bearer <jwt>` header. */
function userFromBearer(route: Route) {
  const auth = route.request().headers()['authorization'] ?? '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return undefined;
  const userId = decodeTokenUserId(match[1]);
  if (userId === null) return undefined;
  return mockDb.findUserById(userId);
}

function currentUser(route: Route) {
  return userFromCookies(route) ?? userFromBearer(route);
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function ok(route: Route, body: unknown = { ok: true }) {
  return json(route, 200, body);
}

function notFound(route: Route) {
  return json(route, 404, { error: 'Not found' });
}

function unauthorized(route: Route) {
  return json(route, 401, { error: 'Unauthorized' });
}

/**
 * Extract a named field from a multipart/form-data body string.
 * Works for simple text fields (not file parts).
 */
function formField(body: string, name: string): string | undefined {
  // Match  name="<name>"\r\n\r\n<value>\r\n
  const re = new RegExp(`name="${name}"\\r?\\n\\r?\\n([^\\r\\n]+)`);
  const m = body.match(re);
  return m ? m[1].trim() : undefined;
}

/** Build a cart response object from cart items. */
function cartResponse(userId: number) {
  const items = mockDb.getCart(userId);
  return {
    user_id: userId,
    items: items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
  };
}

// ── Route setup ──────────────────────────────────────────────────────────────

export async function setupMockRoutes(page: Page): Promise<void> {
  // ── Auth ────────────────────────────────────────────────────────────────

  // POST /api/auth/register
  await page.route(`${API_ORIGIN}/api/auth/register`, async (route) => {
    const postData = route.request().postData() || '{}';
    const data = typeof postData === 'string' ? JSON.parse(postData) : JSON.parse(postData.toString());
    const user = mockDb.ensureUser({
      email: data.email ?? '',
      password: data.password ?? '',
      firstname: data.firstname ?? '',
      lastname: data.lastname ?? '',
      role: data.role ?? 'buyer',
    });
    const { accessToken, refreshToken } = await mockDb.authenticate(user.email, user.password);
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: accessToken,
        url: 'http://localhost:3000',
        sameSite: 'Lax',
      },
      {
        name: 'refreshToken',
        value: refreshToken,
        url: 'http://localhost:3000',
        sameSite: 'Lax',
      },
    ]);
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ user }),
    });
  });

  // POST /api/auth/login
  await page.route(`${API_ORIGIN}/api/auth/login`, async (route) => {
    const postData = route.request().postData() || '{}';
    const data = typeof postData === 'string' ? JSON.parse(postData) : JSON.parse(postData.toString());
    try {
      const { user, accessToken, refreshToken } = await mockDb.authenticate(data.email ?? '', data.password ?? '');
      await page.context().addCookies([
        {
          name: 'accessToken',
          value: accessToken,
          url: 'http://localhost:3000',
          sameSite: 'Lax',
        },
        {
          name: 'refreshToken',
          value: refreshToken,
          url: 'http://localhost:3000',
          sameSite: 'Lax',
        },
      ]);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user }),
      });
    } catch {
      return json(route, 401, { error: 'Identifiants invalides' });
    }
  });

  // GET /api/auth/me
  await page.route(`${API_ORIGIN}/api/auth/me`, (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    return ok(route, user);
  });

  // POST /api/auth/refresh
  await page.route(`${API_ORIGIN}/api/auth/refresh`, (route) => {
    return ok(route, { ok: true });
  });

  // POST /api/auth/logout
  await page.route(`${API_ORIGIN}/api/auth/logout`, (route) => {
    return ok(route, { ok: true });
  });

  // ── Artist profiles ──────────────────────────────────────────────────────

  // GET /api/artists/profile/me/stripe/status
  await page.route(`${API_ORIGIN}/api/artists/profile/me/stripe/**`, (route) => {
    return ok(route, {
      stripeAccountId: null,
      stripeOnboarded: false,
      detailsSubmitted: false,
      chargesEnabled: false,
    });
  });

  // GET /api/artists/profile/me/verification
  await page.route(`${API_ORIGIN}/api/artists/profile/me/verification`, (route) => {
    return ok(route, { status: 'none', documents: [] });
  });

  // GET/PUT /api/artists/profile/me
  await page.route(`${API_ORIGIN}/api/artists/profile/me`, async (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);

    if (route.request().method() === 'PUT' || route.request().method() === 'PATCH') {
      const bodyRawData = route.request().postData();
      const bodyRaw = typeof bodyRawData === 'string' ? bodyRawData : (bodyRawData?.toString() ?? '');
      const bio = formField(bodyRaw, 'bio') ?? '';
      const profile = mockDb.upsertArtistProfile(user.id, { bio });
      const withShops = mockDb.getArtistProfileWithShops(user.id)!;
      return ok(route, withShops);
    }

    const profile = mockDb.getArtistProfileWithShops(user.id);
    if (!profile) return notFound(route);
    return ok(route, profile);
  });

  // POST /api/artists/ (create profile)
  await page.route(`${API_ORIGIN}/api/artists/`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    const profile = mockDb.upsertArtistProfile(user.id, {});
    return json(route, 201, profile);
  });

  // GET /api/artists/:id (public artist profile)
  await page.route(`${API_ORIGIN}/api/artists/*`, (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/artists\/(\d+)/);
    if (!match) return route.continue();
    const userId = parseInt(match[1], 10);
    const profile = mockDb.getArtistProfileWithShops(userId);
    if (!profile) return notFound(route);
    return ok(route, profile);
  });

  // ── Shops ────────────────────────────────────────────────────────────────

  // GET /api/shops/artist/:artistId
  await page.route(`${API_ORIGIN}/api/shops/artist/*`, (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/shops\/artist\/(\d+)/);
    if (!match) return route.continue();
    const artistId = parseInt(match[1], 10);
    return ok(route, mockDb.listShopsByArtist(artistId));
  });

  // GET /api/shops/:id — only handles GET requests; registered before POST handler so LIFO
  // ensures POST /api/shops/ is intercepted by the dedicated handler below without chaining.
  await page.route(`${API_ORIGIN}/api/shops/*`, (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const url = route.request().url();
    // Ignore shipping sub-routes (handled separately below if needed)
    if (/\/shipping|\/shipping-methods/.test(url)) return route.continue();
    const match = url.match(/\/api\/shops\/(\d+)$/);
    if (!match) return route.continue();
    const shopId = parseInt(match[1], 10);
    const shop = mockDb.findShopById(shopId);
    if (!shop) return notFound(route);
    return ok(route, shop);
  });

  // ── Shipping (passthrough — return empty arrays) ──────────────────────────

  await page.route(`${API_ORIGIN}/api/shops/*/shipping*`, (route) => {
    return ok(route, []);
  });

  await page.route(`${API_ORIGIN}/api/shops/*/shipping-methods*`, (route) => {
    return ok(route, []);
  });

  // POST /api/shops/ — registered LAST so Playwright's LIFO routing checks it FIRST,
  // preventing the GET wildcard above from intercepting the shop creation request.
  await page.route(`${API_ORIGIN}/api/shops/`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    // Ensure the artist has a profile (create empty one if missing)
    mockDb.upsertArtistProfile(user.id, {});
    const bodyRawData = route.request().postData();
    const bodyRaw = typeof bodyRawData === 'string' ? bodyRawData : (bodyRawData?.toString() ?? '');
    const name = formField(bodyRaw, 'name') ?? 'Boutique';
    const description = formField(bodyRaw, 'description') ?? '';
    const location = formField(bodyRaw, 'location') ?? '';
    const shop = mockDb.createShop({ artist_id: user.id, name, description, location });
    return json(route, 201, shop);
  });

  // ── Products ─────────────────────────────────────────────────────────────

  // GET /api/products/ (list + single) — registered before POST handler so LIFO
  // ensures POST /api/products/ is handled by the dedicated handler below.
  await page.route(`${API_ORIGIN}/api/products/*`, (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const url = new URL(route.request().url());
    // GET /api/products/:id
    const pathParts = url.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart !== 'products' && /^\d+$/.test(lastPart)) {
      const product = mockDb.findProductById(parseInt(lastPart, 10));
      if (!product) return notFound(route);
      return ok(route, { ...product, images: [] });
    }
    // GET /api/products/ with query params
    const shopId = url.searchParams.get('shop_id');
    const search = url.searchParams.get('search') ?? undefined;
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const list = mockDb.listProducts({
      shop_id: shopId ? parseInt(shopId, 10) : undefined,
      search,
      include_inactive: includeInactive,
    });
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    return ok(route, { total: list.length, page: 1, limit, data: list.map((p) => ({ ...p, images: [] })) });
  });

  // Fallback: GET /api/products (no trailing slash)
  await page.route(`${API_ORIGIN}/api/products`, (route) => {
    if (route.request().method() !== 'GET') return route.continue();
    const url = new URL(route.request().url());
    const search = url.searchParams.get('search') ?? undefined;
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const list = mockDb.listProducts({ search, include_inactive: includeInactive });
    return ok(route, { total: list.length, page: 1, limit: 20, data: list.map((p) => ({ ...p, images: [] })) });
  });

  // POST /api/products/ — registered LAST so Playwright's LIFO routing checks it FIRST.
  await page.route(`${API_ORIGIN}/api/products/`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    const bodyRawData = route.request().postData();
    const bodyRaw = typeof bodyRawData === 'string' ? bodyRawData : (bodyRawData?.toString() ?? '');
    const title = formField(bodyRaw, 'title') ?? 'Produit Mock';
    const price = parseFloat(formField(bodyRaw, 'price') ?? '0') || 0;
    const stock = parseInt(formField(bodyRaw, 'stock') ?? '1', 10) || 1;
    const shopIdStr = formField(bodyRaw, 'shop_id');
    // Use the artist's first shop if shop_id is not parseable from form
    const shops = mockDb.listShopsByArtist(user.id);
    const shopId = shopIdStr ? parseInt(shopIdStr, 10) : (shops[0]?.id ?? 0);
    const product = mockDb.createProduct({
      shop_id: shopId,
      artist_id: user.id,
      title,
      description: formField(bodyRaw, 'description') ?? '',
      price,
      stock,
      is_active: true,
    });
    return json(route, 201, { ...product, images: [] });
  });

  // ── Categories & Tags ────────────────────────────────────────────────────

  await page.route(`${API_ORIGIN}/api/categories/**`, (route) => {
    return ok(route, [
      { id: 1, name: 'Céramique', description: 'Poterie et céramique' },
      { id: 2, name: 'Bijoux', description: 'Bijoux artisanaux' },
      { id: 3, name: 'Textile', description: 'Couture et tricot' },
    ]);
  });

  await page.route(`${API_ORIGIN}/api/tags/**`, (route) => {
    return ok(route, []);
  });

  // ── Cart ─────────────────────────────────────────────────────────────────

  // GET/DELETE /api/cart
  await page.route(`${API_ORIGIN}/api/cart`, async (route) => {
    const method = route.request().method();
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    if (method === 'DELETE') {
      mockDb.clearCart(user.id);
      return ok(route, cartResponse(user.id));
    }
    // GET /api/cart
    return ok(route, cartResponse(user.id));
  });

  // POST /api/cart/items
  await page.route(`${API_ORIGIN}/api/cart/items`, async (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    if (route.request().method() === 'POST') {
      const postData = route.request().postData() || '{}';
      const data = typeof postData === 'string' ? JSON.parse(postData) : JSON.parse(postData.toString());
      mockDb.addToCart(user.id, data.product_id, data.quantity ?? 1);
      return ok(route, cartResponse(user.id));
    }
    return route.continue();
  });

  // PATCH/DELETE /api/cart/items/:id
  await page.route(`${API_ORIGIN}/api/cart/items/*`, async (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    // Simplified: just return current cart for any item-level operation
    return ok(route, cartResponse(user.id));
  });

  // ── Orders ───────────────────────────────────────────────────────────────

  // POST /api/orders
  await page.route(`${API_ORIGIN}/api/orders`, async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    const postData = route.request().postData() || '{}';
    const data = typeof postData === 'string' ? JSON.parse(postData) : JSON.parse(postData.toString());
    const productId = data.items?.[0]?.product_id;
    const product = mockDb.findProductById(productId);
    if (!product) return notFound(route);
    const order = mockDb.createOrder(user.id, product);
    return json(route, 201, order);
  });

  // GET /api/orders/my
  await page.route(`${API_ORIGIN}/api/orders/my`, (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    return ok(route, mockDb.listOrdersByBuyer(user.id));
  });

  // GET /api/orders/artist/my
  await page.route(`${API_ORIGIN}/api/orders/artist/my`, (route) => {
    return ok(route, []);
  });

  // GET /api/orders/:id
  await page.route(`${API_ORIGIN}/api/orders/*`, (route) => {
    const url = route.request().url();
    const match = url.match(/\/api\/orders\/(\d+)/);
    if (!match) return route.continue();
    const order = mockDb.findOrderById(parseInt(match[1], 10));
    if (!order) return notFound(route);
    return ok(route, order);
  });

  // ── Payments ─────────────────────────────────────────────────────────────

  // POST /api/payments/create-intent
  await page.route(`${API_ORIGIN}/api/payments/create-intent`, async (route) => {
    const user = currentUser(route);
    if (!user) return unauthorized(route);
    const postData = route.request().postData() || '{}';
    const data = typeof postData === 'string' ? JSON.parse(postData) : JSON.parse(postData.toString());
    return ok(route, {
      order_id: data.order_id,
      stripe_client_secret: 'mock_pi_secret_test',
      amount: data.amount,
      currency: data.currency ?? 'eur',
    });
  });

  // GET /api/payments/wallet/me
  await page.route(`${API_ORIGIN}/api/payments/wallet/me`, (route) => {
    return ok(route, { walletBalance: 0, pendingBalance: 0 });
  });

  // GET /api/payments/wallet/my-transactions
  await page.route(`${API_ORIGIN}/api/payments/wallet/my-transactions`, (route) => {
    return ok(route, []);
  });

  // ── Notifications (passthrough as empty) ────────────────────────────────

  await page.route(`${API_ORIGIN}/api/notifications/**`, (route) => {
    return ok(route, []);
  });

  // ── Interactions (favorites, reviews) ───────────────────────────────────

  await page.route(`${API_ORIGIN}/api/favorites/**`, (route) => {
    return ok(route, []);
  });

  await page.route(`${API_ORIGIN}/api/reviews/**`, (route) => {
    return ok(route, []);
  });
}
