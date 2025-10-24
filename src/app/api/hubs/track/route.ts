import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { HubModel } from "@/lib/models/Hub";

export async function POST(req: Request) {
  try {
    const { hubId } = await req.json().catch(() => ({}));
    if (!hubId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
    await connectDB();
    await HubModel.updateOne({ _id: hubId }, { $inc: { "stats.clicks": 1 } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
