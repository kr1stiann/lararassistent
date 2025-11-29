import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json();
  const { conversation_id, role, content } = body;

  if (!conversation_id || !role || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("messages")
    .insert([{ conversation_id, role, content }])
    .select()
    .single();

  if (error) {
    console.error("Message save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
