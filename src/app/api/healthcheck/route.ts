import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export async function GET() {
  const checks: Record<string, unknown> = {
    hasDbUrl: !!process.env.DATABASE_URL,
    dbUrlPrefix: process.env.DATABASE_URL?.slice(0, 30) + "...",
  };

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const result = await sql`SELECT 1 as ok`;
    checks.dbConnected = true;
    checks.queryResult = result;
  } catch (error) {
    checks.dbConnected = false;
    checks.dbError = String(error);
  }

  return NextResponse.json(checks);
}
