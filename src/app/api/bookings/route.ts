import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

function validateBookingBody(body: unknown): {
  booking_ref: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  scheduled_time: string;
  vehicle_class: string;
  total_amount: number;
  deposit_amount: number;
} | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.booking_ref !== "string" ||
    typeof b.pickup_address !== "string" ||
    typeof b.dropoff_address !== "string" ||
    typeof b.scheduled_date !== "string" ||
    typeof b.scheduled_time !== "string" ||
    typeof b.vehicle_class !== "string" ||
    typeof b.total_amount !== "number" ||
    typeof b.deposit_amount !== "number"
  ) {
    return null;
  }
  const validClass = ["confort", "premium", "vip"].includes(b.vehicle_class);
  if (!validClass) return null;
  return {
    booking_ref: b.booking_ref,
    pickup_address: b.pickup_address,
    dropoff_address: b.dropoff_address,
    scheduled_date: b.scheduled_date,
    scheduled_time: b.scheduled_time,
    vehicle_class: b.vehicle_class,
    total_amount: Math.round(b.total_amount),
    deposit_amount: Math.round(b.deposit_amount),
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé. Connectez-vous pour enregistrer la réservation." }, { status: 401 });
    }

    const body = await request.json();
    const data = validateBookingBody(body);
    if (!data) {
      return NextResponse.json(
        { error: "Données de réservation invalides." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin.from("bookings").insert({
      user_id: session.user.id,
      booking_ref: data.booking_ref,
      pickup_address: data.pickup_address,
      dropoff_address: data.dropoff_address,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      vehicle_class: data.vehicle_class,
      total_amount: data.total_amount,
      deposit_amount: data.deposit_amount,
      status: "upcoming",
    });

    if (error) {
      console.error("[API bookings] Insert error:", error);
      const message = error.message?.includes("does not exist")
        ? "La table des réservations n'existe pas. Exécutez la migration supabase/migrations/003_bookings.sql dans le SQL Editor Supabase."
        : "Impossible d'enregistrer la réservation.";
      return NextResponse.json(
        { error: message },
        { status: error.message?.includes("does not exist") ? 503 : 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[API bookings] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur. Réessayez plus tard." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const { data: rows, error } = await supabase
      .from("bookings")
      .select("id, booking_ref, pickup_address, dropoff_address, scheduled_date, scheduled_time, vehicle_class, total_amount, deposit_amount, status, created_at")
      .eq("user_id", session.user.id)
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false });

    if (error) {
      console.error("[API bookings] Select error:", error);
      const message = error.message?.includes("does not exist")
        ? "La table des réservations n'existe pas. Exécutez la migration supabase/migrations/003_bookings.sql dans le SQL Editor Supabase."
        : "Impossible de charger les réservations.";
      return NextResponse.json(
        { error: message },
        { status: error.message?.includes("does not exist") ? 503 : 500 }
      );
    }

    return NextResponse.json({ bookings: rows ?? [] });
  } catch (e) {
    console.error("[API bookings] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
