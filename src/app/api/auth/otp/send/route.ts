import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/twilio/client";

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

function generateOtp(): string {
  const digits = Array.from({ length: OTP_LENGTH }, () =>
    Math.floor(Math.random() * 10)
  );
  return digits.join("");
}

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
    const raw = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!raw) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis." },
        { status: 400 }
      );
    }

    const phone = normalizePhone(raw);
    if (!phone) {
      return NextResponse.json(
        { error: "Numéro invalide. Utilisez 9 chiffres (ex: 77 000 00 00)." },
        { status: 400 }
      );
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const supabase = createAdminClient();
    const { error: insertError } = await supabase.from("otp_codes").insert({
      phone,
      code,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("[OTP send] Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Impossible d’enregistrer le code. Réessayez." },
        { status: 500 }
      );
    }

    const smsBody = `Votre code SCOD VTC : ${code}. Valide ${OTP_EXPIRY_MINUTES} min. Ne partagez pas ce code.`;
    const result = await sendSms(phone, smsBody);

    if (!result.success) {
      console.error("[OTP send] Twilio error:", result.error);
      return NextResponse.json(
        { error: result.error || "Envoi du SMS impossible. Vérifiez le numéro." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[OTP send] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}
