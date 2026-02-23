import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_STATUSES = ["upcoming", "active", "done", "cancelled"] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID réservation manquant." }, { status: 400 });
    }

    const body = await request.json();
    const status = typeof body?.status === "string" && ALLOWED_STATUSES.includes(body.status as typeof ALLOWED_STATUSES[number])
      ? (body.status as typeof ALLOWED_STATUSES[number])
      : null;
    if (!status) {
      return NextResponse.json(
        { error: "Statut invalide. Valeurs acceptées : upcoming, active, done, cancelled." },
        { status: 400 }
      );
    }

    const supabase = createClientFromRequest(request);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: row, error: fetchError } = await admin
      .from("bookings")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }
    if (row.user_id !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { data: updated, error: updateError } = await admin
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select("id, status")
      .single();

    if (updateError || !updated) {
      console.error("[API bookings PATCH] Error:", updateError);
      return NextResponse.json(
        { error: "Impossible de mettre à jour la réservation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, status: updated.status });
  } catch (e) {
    console.error("[API bookings PATCH] Error:", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
