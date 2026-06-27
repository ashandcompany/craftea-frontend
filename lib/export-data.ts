import { auth, addresses, orders } from "./api";

export async function fetchUserExport() {
    const [profile, userAddresses, userOrders] = await Promise.all([
        auth.me(),
        addresses.list(),
        orders.my(),
    ]);
    return {
        exported_at: new Date().toISOString(),
        profile,
        addresses: userAddresses,
        orders: userOrders,
    };
}
