import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "huaman_token";

const protectedPrefixes = ["/dashboard", "/chat", "/admin", "/profile"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (isProtectedPath(pathname) && !token) {
    const loginUrl = new URL("/login", request.url);
    const nextPath = `${pathname}${search}`;
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/admin/:path*", "/profile/:path*"],
};
