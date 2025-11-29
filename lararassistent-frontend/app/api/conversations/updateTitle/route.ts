import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  // Läs request body
  const body = await req.json();

  // 👉 Lägg loggen här
  console.log("UPDATE_TITLE BODY:", body);

  const { conversation_id, title } = body;

  if (!conversation_id || !title) {
    return NextResponse.json(
      { error: "Missing conversation_id or title" },
      { status: 400 }
    );
  }

  // Uppdatera titel i Supabase
  const { data, error } = await supabaseServer
    .from("conversations")
    .update({ title })
    .eq("id", conversation_id)
    .select()
    .single();

  if (error) {
    console.error("updateTitle error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, conversation: data });
}
