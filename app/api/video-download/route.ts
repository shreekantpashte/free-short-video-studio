import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await context.params;
  const pathSegments = resolvedParams.path || [];
  const search = req.nextUrl.search || "";

  const queryUrl = req.nextUrl.searchParams.get("url");
  let targetUrl = "";

  if (queryUrl) {
    targetUrl = queryUrl;
  } else {
    const joinedPath = pathSegments.join("/");
    targetUrl = joinedPath.startsWith("http")
      ? `${joinedPath}${search}`
      : `https://${joinedPath}${search}`;
  }

  try {
    const upstream = await fetch(targetUrl, {
      headers: {
        "User-Agent": req.headers.get("user-agent") || "Mozilla/5.0",
      },
    });

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("Content-Type") || "video/mp4"
    );
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to proxy video clip" },
      { status: 500 }
    );
  }
}

