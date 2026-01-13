import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "defaultsecret";

export async function GET(req: Request) {
  try {
    // ✅ cookies() now returns a Promise<ReadonlyRequestCookies>
    const cookieStore = await cookies();
    let token = cookieStore.get("token")?.value;

    // If token not found in cookieStore, try reading from request headers as fallback
    if (!token) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split("=");
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies["token"];
      }
    }

    // Log for debugging
    const allCookies = cookieStore.getAll();
    console.log("All cookies from cookieStore:", allCookies.map(c => c.name));
    console.log("Token cookie value:", token ? "exists" : "missing");
    
    if (req.headers.get("cookie")) {
      console.log("Cookie header present:", req.headers.get("cookie")?.substring(0, 50) + "...");
    } else {
      console.log("No cookie header in request");
    }

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        id: number;
        email: string;
        role: string;
        hospitalId?: number;
      };

      return NextResponse.json({ user: decoded });
    } catch (err: any) {
      console.error("JWT verification failed in /api/auth/me:", err.message);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
