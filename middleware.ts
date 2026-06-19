import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/jobs", "/internships", "/about", "/find-talent"];
const AUTH_ONLY = ["/auth/login", "/auth/register"];

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user?.id;
  const isPublic = PUBLIC_ROUTES.some((r) => nextUrl.pathname === r || nextUrl.pathname.startsWith(r + "/"));
  const isAuthPage = AUTH_ONLY.includes(nextUrl.pathname);

  if (isLoggedIn && isAuthPage) {
    const role = (session.user as any)?.role;
    const dashboardUrl = role === "EMPLOYER" ? "/dashboard/employer" : role === "ADMIN" ? "/dashboard/admin" : "/dashboard/job-seeker";
    return NextResponse.redirect(new URL(dashboardUrl, nextUrl));
  }

  if (!isLoggedIn && !isPublic) {
    const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
