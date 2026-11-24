import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createApiToken } from "@/lib/api-token";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const authUrl = process.env.AUTH_URL;
    const origin = request.headers.get("origin");

    if (!authUrl) {
      throw new Error("AUTH_URL is missing");
    }

    const allowedOrigin = new URL(authUrl).origin;

    if (origin !== allowedOrigin) {
      return NextResponse.json(
        { message: "Invalid request origin" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const token = await createApiToken();

    const backendUrl = process.env.BACKEND_API_URL;

    if (!backendUrl) {
      throw new Error("BACKEND_API_URL is missing");
    }

    const response = await fetch(
      `${backendUrl.replace(/\/$/, "")}/voice/call/web`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId: body.assistantId,
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Voice proxy request failed:", error);

    return NextResponse.json(
      { message: "Unable to start voice session" },
      { status: 502 }
    );
  }
}