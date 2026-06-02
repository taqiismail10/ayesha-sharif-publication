import { NextResponse } from "next/server";
import { privateNoStoreHeaders } from "@/lib/http-cache";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ayesha-sharif-publication",
      environment: process.env.NODE_ENV || "unknown",
      database: "not_checked",
      checkedAt: new Date().toISOString()
    },
    { headers: privateNoStoreHeaders }
  );
}
