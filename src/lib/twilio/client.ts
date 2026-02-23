import twilio from "twilio";

/**
 * Client Twilio pour l'envoi de SMS (OTP, notifications).
 * Variables d'environnement : TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */
export function getTwilioClient(): ReturnType<typeof twilio> | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

export function getTwilioPhoneNumber(): string | null {
  return process.env.TWILIO_PHONE_NUMBER || null;
}

/**
 * Envoie un SMS via Twilio.
 * @param to - Numéro au format E.164 (ex: +221778223493)
 * @param body - Texte du message
 */
export async function sendSms(
  to: string,
  body: string
): Promise<{ success: true; sid: string } | { success: false; error: string }> {
  const client = getTwilioClient();
  const from = getTwilioPhoneNumber();
  if (!client || !from) {
    return { success: false, error: "Twilio non configuré (variables d'environnement manquantes)." };
  }
  try {
    const message = await client.messages.create({ body, from, to });
    return { success: true, sid: message.sid };
  } catch (e) {
    const err = e as { message?: string; code?: number };
    return {
      success: false,
      error: err.message || "Échec de l'envoi du SMS.",
    };
  }
}
