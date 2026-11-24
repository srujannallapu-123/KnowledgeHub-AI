import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
    const pathname = request.nextUrl.pathname;

    const isLoggedIn = Boolean(request.auth);

    const isAuthPage =
        pathname.startsWith("/sign-in") ||
        pathname.startsWith("/sign-up");

    const isProtectedPage =
        pathname.startsWith("/companions") ||
        pathname.startsWith("/my-journey") ||
        pathname.startsWith("/subscription");

    if (isProtectedPage && !isLoggedIn) {
        return NextResponse.redirect(
            new URL("/sign-in", request.url)
        );
    }

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(
            new URL("/", request.url)
        );
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/companions/:path*",
        "/my-journey/:path*",
        "/subscription/:path*",
        "/sign-in/:path*",
        "/sign-up/:path*",
    ],
};