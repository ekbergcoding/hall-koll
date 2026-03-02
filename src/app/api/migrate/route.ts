import { migrate } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await migrate();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
