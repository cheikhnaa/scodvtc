import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function validateBody(body: unknown): {
  subject: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
  payload?: Record<string, unknown>;
} | null {
  if (!body || typeof body !== "object" || !("subject" in body) || !("name" in body) || !("email" in body) || !("message" in body)) {
    return null;
  }
  const b = body as Record<string, unknown>;
  if (typeof b.subject !== "string" || typeof b.name !== "string" || typeof b.email !== "string" || typeof b.message !== "string") {
    return null;
  }
  const result: {
    subject: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    source?: string;
    payload?: Record<string, unknown>;
  } = {
    subject: b.subject,
    name: b.name,
    email: b.email,
    message: b.message,
  };
  if (typeof b.phone === "string" && b.phone) result.phone = b.phone;
  if (typeof b.source === "string" && b.source) result.source = b.source;
  if (b.payload && typeof b.payload === "object" && !Array.isArray(b.payload)) result.payload = b.payload as Record<string, unknown>;
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = validateBody(body);
    if (!data) {
      return NextResponse.json(
        { error: "Champs requis : subject, name, email, message" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("contact_messages").insert({
      subject: data.subject,
      name: data.name,
      email: data.email,
      phone: data.phone ?? null,
      message: data.message,
      source: data.source ?? "assistance",
      payload: data.payload ?? null,
    });

    if (error) {
      console.error("[API contact] Supabase insert error:", error);
      return NextResponse.json(
        { error: "Impossible d’enregistrer le message. Réessayez plus tard." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API contact] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
