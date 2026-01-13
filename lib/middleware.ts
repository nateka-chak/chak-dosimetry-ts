// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const { pathname } = req.nextUrl;

  // Explicit public routes
  const PUBLIC_PATHS = ["/login", "/signup", "/reset-password"];
  
  // Always allow static files and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/" ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // ---- Protected routes below ----
  const rawToken = req.cookies.get("token")?.value;

  if (!rawToken) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const decoded: any = jwt.verify(
      rawToken,
      process.env.JWT_SECRET || "defaultsecret"
    );

    // Role-based headers
    const res = NextResponse.next();
    if (decoded.role === "ADMIN") {
      res.headers.set("x-user-role", "ADMIN");
    }
    if (decoded.role === "HOSPITAL") {
      res.headers.set("x-user-role", "HOSPITAL");
      if (decoded.hospitalId) {
        res.headers.set("x-tenant-id", String(decoded.hospitalId));
      }
    }
    return res;
  } catch {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",  
    "/shipments/:path*",
    "/dispatch/:path*",
    "/receive/:path*",
    "/api/:path*"
  ],
};
