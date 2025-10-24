import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { HubModel } from "@/lib/models/Hub";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await connectDB();

    const { id } = await ctx.params;
    const hub = await HubModel.findOne({ _id: id, ownerEmail: session.user.email }).lean();
    if (!hub) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json(hub);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const patch: any = {};
    if (body.title !== undefined) patch.title = String(body.title);
    if (body.status !== undefined) patch.status = String(body.status);
    if (body.data !== undefined) patch.data = body.data;

    if (body.slug !== undefined) {
        patch.slug = String(body.slug);
    }

    const { id } = await ctx.params;
    const hub: any = await HubModel.findOneAndUpdate(
        { _id: id, ownerEmail: session.user.email },
        { $set: patch },
        { new: true }
    ).lean();

    if (!hub) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ok: true, updatedAt: hub.updatedAt });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await connectDB();

    const { id } = await ctx.params;
    await HubModel.deleteOne({ _id: id, ownerEmail: session.user.email });
    return NextResponse.json({ ok: true });
}
