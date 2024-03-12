import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const baseUrl = process.env.API_BASE_URL;
  const apiUrl = new URL("/api/users/me", baseUrl).href;
  const res = NextResponse.next();

  res.headers.append("Access-Control-Allow-Credentials", "true");
  res.headers.append("Access-Control-Allow-Origin", "*:*");
  res.headers.append(
    "Access-Control-Allow-Methods",
    "GET,DELETE,PATCH,POST,PUT"
  );
  res.headers.append(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (pathname === "/login" || pathname === "/wsTest") {
    return NextResponse.next();
  }

  const userToken = request.cookies.get("trans42_access");

  if (!userToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return await fetch(apiUrl, {
    headers: {
      Cookie: `trans42_access=${userToken!.value};`,
    },
  })
    .then(async (res) => {
      if (res.ok) {
        return NextResponse.next();
      } else return NextResponse.redirect(new URL("/login", request.url));
    })
    .catch((err) => {
      return NextResponse.redirect(new URL("/login", request.url));
    });
}
