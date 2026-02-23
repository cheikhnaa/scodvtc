import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function validateRentalBody(body: unknown): {
  booking_ref: string;
  vehicle_label: string;
  period: string;
  start_date: string;
  end_date: string;
  pickup_address: string;
  total_amount: number;
} | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.booking_ref !== "string" ||
    typeof b.vehicle_label !== "string" ||
    typeof b.period !== "string" ||
    typeof b.start_date !== "string" ||
    typeof b.end_date !== "string" ||
    typeof b.total_amount !== "number"
  ) {
    return null;
  }
  return {
    booking_ref: b.booking_ref,
    vehicle_label: b.vehicle_label,
    period: b.period,
    start_date: b.start_date,
    end_date: b.end_date,
    pickup_address: typeof b.pickup_address === "string" ? b.pickup_address : "",
    total_amount: Math.round(b.total_amount),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé. Connectez-vous pour enregistrer la location." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = validateRentalBody(body);
    if (!data) {
      return NextResponse.json(
        { error: "Données de location invalides." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("rentals").insert({
      user_id: session.user.id,
      booking_ref: data.booking_ref,
      vehicle_label: data.vehicle_label,
      period: data.period,
      start_date: data.start_date,
      end_date: data.end_date,
      pickup_address: data.pickup_address || null,
      total_amount: data.total_amount,
      status: "upcoming",
    });

    if (error) {
      console.error("[API rentals] Insert error:", error);
      const message = error.message?.includes("does not exist")
        ? "La table des locations n'existe pas. Exécutez la migration supabase/migrations/004_rentals.sql dans le SQL Editor Supabase."
        : "Impossible d'enregistrer la location.";
      return NextResponse.json(
        { error: message },
        { status: error.message?.includes("does not exist") ? 503 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API rentals] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("rentals")
      .select("id, booking_ref, vehicle_label, period, start_date, end_date, pickup_address, total_amount, status, created_at")
      .eq("user_id", session.user.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[API rentals] Select error:", error);
      const message = error.message?.includes("does not exist")
        ? "La table des locations n'existe pas. Exécutez la migration supabase/migrations/004_rentals.sql."
        : "Impossible de charger les locations.";
      return NextResponse.json(
        { error: message },
        { status: error.message?.includes("does not exist") ? 503 : 500 }
      );
    }

    return NextResponse.json({ rentals: rows ?? [] });
  } catch (e) {
    console.error("[API rentals] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
