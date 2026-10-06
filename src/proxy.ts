import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Public paths that do NOT require authentication
const PUBLIC_PATHS = ['/login'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through without auth check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip Next.js internal routes, static files, and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Read the Supabase session token from cookies
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Extract access token from cookies (Supabase uses pkce / sb-<projectRef>-auth-token)
  const cookieHeader = request.headers.get('cookie') ?? '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (k) cookies[k.trim()] = decodeURIComponent(rest.join('='));
  });

  // Try to find any Supabase auth token cookie
  const tokenKey = Object.keys(cookies).find(
    (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
  );

  let isAuthenticated = false;

  if (tokenKey && cookies[tokenKey]) {
    try {
      const tokenData = JSON.parse(cookies[tokenKey]);
      const accessToken = Array.isArray(tokenData) ? tokenData[0] : tokenData?.access_token;

      if (accessToken) {
        // Verify the token with Supabase
        const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
        isAuthenticated = !error && !!data.user;
      }
    } catch {
      // Token parse error → not authenticated
    }
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the originally requested URL so we can redirect back after login
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run proxy on all routes except Next.js internals and static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
