import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type UserRole = "admin" | "doctor" | "patient";

const roleHome: Record<UserRole, string> = {
  admin: "/admin/dashboard",
  doctor: "/doctor/dashboard",
  patient: "/patient/dashboard",
};

function isKnownRole(value: unknown): value is UserRole {
  return value === "admin" || value === "doctor" || value === "patient";
}

function canAccess(pathname: string, role: UserRole) {
  if (pathname.startsWith("/admin")) return role === "admin";
  if (pathname.startsWith("/doctor")) return role === "doctor" || role === "admin";
  return true;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let pendingCookies: Parameters<SetAllCookies>[0] = [];
  let pendingHeaders: Record<string, string> = {};

  const redirectWithSession = (pathname: string, reason?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (reason) url.searchParams.set("error", reason);

    const redirect = NextResponse.redirect(url);
    pendingCookies.forEach(({ name, value, options }) => {
      redirect.cookies.set(name, value, options);
    });
    Object.entries(pendingHeaders).forEach(([name, value]) => {
      redirect.headers.set(name, value);
    });
    return redirect;
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    return redirectWithSession("/login", "configuration");
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        pendingCookies = cookiesToSet;
        pendingHeaders = headers;
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          supabaseResponse.headers.set(name, value);
        });
      },
    },
  });

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return redirectWithSession("/login", "authentication-required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profileError || !isKnownRole(profile?.role)) {
    return redirectWithSession("/login", "profile-unavailable");
  }

  if (!canAccess(request.nextUrl.pathname, profile.role)) {
    return redirectWithSession(roleHome[profile.role], "forbidden");
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/patient/:path*", "/doctor/:path*", "/admin/:path*"],
};
