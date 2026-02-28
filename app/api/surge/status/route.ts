import { NextResponse } from 'next/server';

const SURGE_BASE = 'https://back.surge.xyz';

function surgeHeaders(apiKey: string) {
  return { 'X-API-Key': apiKey, 'Content-Type': 'application/json' };
}

export async function POST(req: Request) {
  const body = await req.json() as { walletId?: string; tokenAddress?: string; apiKey?: string };
  const apiKey = body.apiKey || process.env.SURGE_API_KEY || '';
  if (!apiKey) return NextResponse.json({ error: 'No SURGE API key' }, { status: 401 });

  const results: Record<string, any> = {};

  if (body.walletId) {
    try {
      const balRes = await fetch(`${SURGE_BASE}/openclaw/wallet/${body.walletId}/balance`, { headers: surgeHeaders(apiKey) });
      const text = await balRes.text();
      try { results.balance = JSON.parse(text); } catch { results.balance = { raw: text.slice(0, 200) }; }
    } catch (e: any) { results.balance = { error: e?.message }; }
  }

  if (body.tokenAddress) {
    try {
      const tokRes = await fetch(`${SURGE_BASE}/openclaw/token/${body.tokenAddress}`, { headers: surgeHeaders(apiKey) });
      const text = await tokRes.text();
      try { results.token = JSON.parse(text); } catch { results.token = { raw: text.slice(0, 200) }; }
    } catch (e: any) { results.token = { error: e?.message }; }
  }

  return NextResponse.json(results);
}
