import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Normalise le numéro en E.164 pour le Sénégal (+221). */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const local = digits.slice(-9);
  return `+221${local}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawPhone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";

    if (!rawPhone || !code) {
      return NextResponse.json(
        { error: "Numéro et code requis." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(rawPhone);
    if (!phone) {
      return NextResponse.json(
        { error: "Numéro invalide." },
        { status: 400 }
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: "Le code doit contenir 6 chiffres." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: rows, error: fetchError } = await supabase
      .from("otp_codes")
      .select("id")
      .eq("phone", phone)
      .eq("code", code)
      .gt("expires_at", new Date().toISOString())
      .limit(1);

    if (fetchError) {
      console.error("[OTP verify] Supabase error:", fetchError);
      return NextResponse.json(
        { error: "Vérification impossible. Réessayez." },
        { status: 500 }
      );
    }

    if (!rows?.length) {
      return NextResponse.json(
        { error: "Code incorrect ou expiré. Vérifiez le SMS ou demandez un nouveau code." },
        { status: 400 }
      );
    }

    await supabase
      .from("otp_codes")
      .delete()
      .eq("phone", phone)
      .eq("code", code);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[OTP verify] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
