import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/login");
  const isAuthCallback = pathname.startsWith("/auth/callback");
  const isResetPassword = pathname.startsWith("/reset-password");

  if (isAuthCallback || isResetPassword) {
    return supabaseResponse;
  }

  if (isAdminRoute && !user) {
    return NextResponse.redirect(
      new URL("/login?redirectTo=/admin", request.url),
    );
  }

  if (isLoginRoute && user) {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const safeRedirect =
      redirectTo?.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/";
    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
