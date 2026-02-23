import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";

/**
 * API unifiée tableau de bord (style Uber) : retourne en un seul appel
 * les trajets (bookings) et les locations (rentals) de l'utilisateur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClientFromRequest(request);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non autorisé. Connectez-vous pour accéder au tableau de bord." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [bookingsResult, rentalsResult] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, booking_ref, pickup_address, dropoff_address, scheduled_date, scheduled_time, vehicle_class, total_amount, deposit_amount, status, created_at")
        .eq("user_id", userId)
        .order("scheduled_date", { ascending: false })
        .order("scheduled_time", { ascending: false }),
      supabase
        .from("rentals")
        .select("id, booking_ref, vehicle_label, period, start_date, end_date, pickup_address, total_amount, status, created_at")
        .eq("user_id", userId)
        .order("start_date", { ascending: false }),
    ]);

    const bookings = bookingsResult.error ? [] : (bookingsResult.data ?? []);
    const rentals = rentalsResult.error ? [] : (rentalsResult.data ?? []);
    const errors: string[] = [];
    if (bookingsResult.error) {
      console.error("[API dashboard] Bookings error:", bookingsResult.error);
      errors.push(
        bookingsResult.error.message?.includes("does not exist")
          ? "Table des trajets manquante (exécutez 003_bookings.sql)."
          : "Impossible de charger les trajets."
      );
    }
    if (rentalsResult.error) {
      console.error("[API dashboard] Rentals error:", rentalsResult.error);
      errors.push(
        rentalsResult.error.message?.includes("does not exist")
          ? "Table des locations manquante (exécutez 004_rentals.sql)."
          : "Impossible de charger les locations."
      );
    }

    return NextResponse.json({
      bookings,
      rentals,
      error: errors.length > 0 ? errors.join(" ") : undefined,
    });
  } catch (e) {
    console.error("[API dashboard] Error:", e);
    return NextResponse.json(
      { error: "Erreur serveur.", bookings: [], rentals: [] },
      { status: 500 }
    );
  }
}
