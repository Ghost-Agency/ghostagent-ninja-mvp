import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SURGE_BASE = 'https://back.surge.xyz';

function surgeHeaders(apiKey: string) {
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
  };
}

export async function POST(req: Request) {
  const body = await req.json() as {
    action: 'launch-info' | 'create-wallet' | 'fund-wallet' | 'check-balance' | 'launch';
    apiKey?: string;
    walletId?: string;
    name?: string;
    ticker?: string;
    description?: string;
    logoUrl?: string;
    chainId?: string;
    ethAmount?: string;
    websiteLink?: string;
    githubLink?: string;
    xLink?: string;
    category?: string;
  };

  const apiKey = body.apiKey || process.env.SURGE_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json({ error: 'No SURGE API key configured. Add SURGE_API_KEY to env vars or pass apiKey in the request.' }, { status: 401 });
  }

  try {
    switch (body.action) {

      case 'launch-info': {
        const res = await fetch(`${SURGE_BASE}/openclaw/launch-info`, {
          headers: surgeHeaders(apiKey),
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { return NextResponse.json({ error: `launch-info returned non-JSON: ${text.slice(0, 200)}`, code: res.status }, { status: 502 }); }
        if (!res.ok) return NextResponse.json({ error: data?.message || 'launch-info failed', code: res.status }, { status: res.status });
        return NextResponse.json(data);
      }

      case 'create-wallet': {
        const res = await fetch(`${SURGE_BASE}/openclaw/wallet/create`, {
          method: 'POST',
          headers: surgeHeaders(apiKey),
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { return NextResponse.json({ error: `wallet/create returned non-JSON: ${text.slice(0, 200)}`, code: res.status }, { status: 502 }); }
        if (!res.ok) return NextResponse.json({ error: data?.message || 'wallet create failed', code: res.status }, { status: res.status });
        return NextResponse.json(data);
      }

      case 'fund-wallet': {
        if (!body.walletId) return NextResponse.json({ error: 'walletId required' }, { status: 400 });
        const res = await fetch(`${SURGE_BASE}/openclaw/wallet/${body.walletId}/fund`, {
          method: 'POST',
          headers: surgeHeaders(apiKey),
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { return NextResponse.json({ error: `fund returned non-JSON: ${text.slice(0, 200)}`, code: res.status }, { status: 502 }); }
        if (!res.ok) return NextResponse.json({ error: data?.message || 'fund failed', code: res.status }, { status: res.status });
        return NextResponse.json(data);
      }

      case 'check-balance': {
        if (!body.walletId) return NextResponse.json({ error: 'walletId required' }, { status: 400 });
        const res = await fetch(`${SURGE_BASE}/openclaw/wallet/${body.walletId}/balance`, {
          headers: surgeHeaders(apiKey),
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { return NextResponse.json({ error: `balance check returned non-JSON: ${text.slice(0, 200)}`, code: res.status }, { status: 502 }); }
        if (!res.ok) return NextResponse.json({ error: data?.message || 'balance check failed', code: res.status }, { status: res.status });
        return NextResponse.json(data);
      }

      case 'launch': {
        if (!body.walletId || !body.name || !body.ticker || !body.description || !body.logoUrl || !body.chainId) {
          return NextResponse.json({ error: 'walletId, name, ticker, description, logoUrl, chainId are required' }, { status: 400 });
        }
        const payload: Record<string, any> = {
          name: body.name,
          ticker: body.ticker,
          description: body.description,
          logoUrl: body.logoUrl,
          chainId: body.chainId,
          walletId: body.walletId,
          ethAmount: parseFloat(body.ethAmount || '0.0005'),
        };
        if (body.websiteLink) payload.websiteLink = body.websiteLink;
        if (body.githubLink) payload.githubLink = body.githubLink;
        if (body.xLink) payload.xLink = body.xLink;
        if (body.category) payload.category = body.category;

        const res = await fetch(`${SURGE_BASE}/openclaw/launch`, {
          method: 'POST',
          headers: surgeHeaders(apiKey),
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        let data: any;
        try { data = JSON.parse(text); } catch { return NextResponse.json({ error: `launch returned non-JSON: ${text.slice(0, 500)}`, httpStatus: res.status }, { status: 502 }); }
        if (!res.ok) return NextResponse.json({ error: data?.message || data?.errorMessage || 'launch failed', surgeError: data, httpStatus: res.status, sentPayload: payload }, { status: res.status });
        return NextResponse.json(data);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
