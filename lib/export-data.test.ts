import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchUserExport } from "./export-data";

vi.mock("./api", () => ({
    auth: { me: vi.fn() },
    addresses: { list: vi.fn() },
    orders: { my: vi.fn() },
}));

import { auth, addresses, orders } from "./api";

const mockProfile = { id: 1, firstname: "Alice", lastname: "Martin", email: "alice@example.com", role: "buyer" as const, is_active: true, created_at: "2025-01-01T00:00:00.000Z", updated_at: "2025-01-01T00:00:00.000Z" };
const mockAddresses = [{ id: 1, user_id: 1, street: "12 rue des Arts", city: "Paris", postal_code: "75001", country: "FR" }];
const mockOrders = [{ id: 10, user_id: 1, status: "delivered" as const, total: 4500, shipping_total: 0, items: [], created_at: "2025-06-01T00:00:00.000Z", updated_at: "2025-06-15T00:00:00.000Z" }];

describe("fetchUserExport", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth.me).mockResolvedValue(mockProfile);
        vi.mocked(addresses.list).mockResolvedValue(mockAddresses);
        vi.mocked(orders.my).mockResolvedValue(mockOrders);
    });

    it("aggregates profile, addresses and orders into a single payload", async () => {
        const result = await fetchUserExport();

        expect(result.profile).toEqual(mockProfile);
        expect(result.addresses).toEqual(mockAddresses);
        expect(result.orders).toEqual(mockOrders);
        expect(result.exported_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("calls all three API endpoints exactly once", async () => {
        await fetchUserExport();

        expect(vi.mocked(auth.me)).toHaveBeenCalledOnce();
        expect(vi.mocked(addresses.list)).toHaveBeenCalledOnce();
        expect(vi.mocked(orders.my)).toHaveBeenCalledOnce();
    });
});
