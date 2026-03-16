# Farcaster Mini App Authentication Guide

## Quick Auth JWT Structure

When using `@farcaster/quick-auth`, the JWT payload has this structure:

```typescript
interface QuickAuthPayload {
  sub: number;        // FID (Farcaster ID) - THIS IS WHERE THE FID IS!
  iss: string;        // Issuer (e.g., "auth.farcaster.xyz")
  aud: string;        // Audience (your domain)
  iat: number;        // Issued at timestamp
  exp: number;        // Expiration timestamp
}
```

## Common Mistakes

### ❌ WRONG: Looking for fid property
```typescript
const payload = await client.verifyJwt({ token, domain });
const fid = payload.fid;  // undefined!
```

### ✅ CORRECT: Using sub property
```typescript
const payload = await client.verifyJwt({ token, domain });
const fid = typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
```

## Complete Working Example

```typescript
import { createClient } from '@farcaster/quick-auth';
import { NextResponse } from 'next/server';

const client = createClient();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  
  const token = authHeader.replace('Bearer ', '').trim();
  const domain = new URL(APP_URL).host;
  
  try {
    const payload = await client.verifyJwt({ token, domain });
    
    // FID is in payload.sub, NOT payload.fid
    const fid = typeof payload.sub === 'number' 
      ? payload.sub 
      : Number(payload.sub);
    
    if (!fid || Number.isNaN(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID in token' }, 
        { status: 401 }
      );
    }
    
    // Fetch user from your database or Neynar
    const user = await fetchUser(fid);
    
    return NextResponse.json({ user });
  } catch (e) {
    console.error('JWT verification failed:', e);
    return NextResponse.json(
      { error: 'Invalid token' }, 
      { status: 401 }
    );
  }
}
```

## Domain Requirements

The domain used in `verifyJwt` MUST match exactly what's in your `farcaster.json` manifest.

## References

- [Quick Auth Docs](https://miniapps.farcaster.xyz/docs/sdk/quick-auth)
