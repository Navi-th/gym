import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    platform: "Cloudflare Workers / OpenNext",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    edgeInfo: {
      location: "Edge-Global",
      compatFlags: ["nodejs_compat"]
    }
  });
}
