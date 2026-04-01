import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const TEMPLATE_URLS: Record<string, string> = {
  'order-confirmation': `${API_BASE}/api/notifications/templates/order-confirmation`,
  'kyc-invite':         `${API_BASE}/api/notifications/templates/kyc-invite`,
  'kyc-confirmed':      `${API_BASE}/api/notifications/templates/kyc-confirmed`,
  'payout-sent':        `${API_BASE}/api/notifications/templates/payout-sent`,
  'payout-failed':      `${API_BASE}/api/notifications/templates/payout-failed`,
  'reset-password':     `${API_BASE}/api/users/templates/reset-password`,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const url = TEMPLATE_URLS[name];
  if (!url) {
    return new NextResponse('Template not found', { status: 404 });
  }

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return new NextResponse(`Backend returned ${res.status}`, { status: res.status });
    }
    const html = await res.text();
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new NextResponse(
      `Could not reach backend: ${(err as Error).message}`,
      { status: 502 },
    );
  }
}
