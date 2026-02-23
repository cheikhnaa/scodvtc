"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MapPin,
  ChevronRight,
  Car,
  Calendar,
  Clock,
  Star,
  ArrowRight,
  CarFront,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useDashboardUser } from "@/contexts/dashboard-user-context";

/* ─────────────────────────────────────────────────────────
   Types (alignés avec la page réservations)
───────────────────────────────────────────────────────── */

type TripStatus = "upcoming" | "active" | "done" | "cancelled";

interface Trip {
  id: string;
  status: TripStatus;
  date: string;
  time: string;
  from: string;
  to: string;
  vehicle: string;
  driver: { initials: string; name: string; rating: number };
  price: number;
  currency: string;
}

interface Rental {
  id: string;
  status: "upcoming" | "active" | "done" | "cancelled";
  vehicle: string;
  period: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
}

const VEHICLE_LABELS: Record<string, string> = {
  confort: "Confort",
  premium: "Premium",
  vip: "VIP",
};

function mapApiRowToTrip(row: Record<string, unknown>): Trip {
  const status = ["upcoming", "active", "done", "cancelled"].includes(String(row.status))
    ? (row.status as TripStatus)
    : "upcoming";
  const scheduledDate = String(row.scheduled_date ?? "");
  return {
    id: String(row.id),
    status,
    date: scheduledDate
      ? new Date(scheduledDate + "Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : "",
    time: String(row.scheduled_time ?? ""),
    from: String(row.pickup_address ?? ""),
    to: String(row.dropoff_address ?? ""),
    vehicle: VEHICLE_LABELS[String(row.vehicle_class ?? "")] ?? String(row.vehicle_class ?? ""),
    driver: { initials: "—", name: "À assigner", rating: 0 },
    price: Number(row.total_amount ?? 0),
    currency: "FCFA",
  };
}

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */

function formatFcfa(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);
}

const upcomingOrActive = (t: Trip) => t.status === "upcoming" || t.status === "active";

function mapApiRowToRental(row: Record<string, unknown>): Rental {
  const status = ["upcoming", "active", "done", "cancelled"].includes(String(row.status))
    ? (row.status as Rental["status"])
    : "upcoming";
  const startDate = String(row.start_date ?? "");
  const endDate = String(row.end_date ?? "");
  return {
    id: String(row.id),
    status,
    vehicle: String(row.vehicle_label ?? ""),
    period: String(row.period ?? ""),
    startDate: startDate
      ? new Date(startDate + "Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : "",
    endDate: endDate
      ? new Date(endDate + "Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
      : "",
    price: Number(row.total_amount ?? 0),
    currency: "FCFA",
  };
}

/* ─────────────────────────────────────────────────────────
   Dashboard Home Page (chargement unifié style Uber)
───────────────────────────────────────────────────────── */

export default function MonComptePage() {
  const { info } = useDashboardUser();
  const firstName = info?.displayName?.split(/\s+/)[0] ?? "Utilisateur";
  const [trips, setTrips] = useState<Trip[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = (await res.json()) as {
        bookings?: unknown[];
        rentals?: unknown[];
        error?: string;
      };
      if (!res.ok) {
        setTrips([]);
        setRentals([]);
        setError(
          data?.error ??
            (res.status === 401 ? "Connectez-vous pour voir vos trajets et locations." : "Impossible de charger le tableau de bord.")
        );
        return;
      }
      const bookingsList = Array.isArray(data?.bookings) ? data.bookings : [];
      const rentalsList = Array.isArray(data?.rentals) ? data.rentals : [];
      setTrips(bookingsList.map((row: Record<string, unknown>) => mapApiRowToTrip(row)));
      setRentals(rentalsList.map((row: Record<string, unknown>) => mapApiRowToRental(row)));
      setError(data?.error ?? null);
    } catch {
      setTrips([]);
      setRentals([]);
      setError("Impossible de charger le tableau de bord.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadDashboard().then(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadDashboard]);

  useEffect(() => {
    const onFocus = () => loadDashboard();
    if (typeof window === "undefined") return;
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadDashboard]);

  const nextTrip = useMemo(() => trips.find(upcomingOrActive), [trips]);
  const recentTrips = useMemo(() => trips.filter((t) => t.status === "done").slice(0, 3), [trips]);
  const tripsThisMonth = useMemo(() => trips.filter((t) => t.status !== "cancelled").length, [trips]);
  const rentalsCount = useMemo(() => rentals.filter((r) => r.status !== "cancelled").length, [rentals]);
  const recentRentals = useMemo(() => rentals.filter((r) => r.status === "done").slice(0, 2), [rentals]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* En-tête + salutation */}
      <div>
        <h1 className="font-sans text-[26px] font-bold tracking-[-0.02em] text-grey-900 sm:text-[28px]">
          Bonjour, {firstName}
        </h1>
        <p className="mt-1 text-[14px] text-grey-500">
          Voici un aperçu de vos trajets et locations.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800"
        >
          {error}
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-grey-200 bg-white py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-[14px] text-grey-500">Chargement de vos trajets et locations…</p>
        </div>
      )}

      {/* Carte Prochain trajet (style Uber) */}
      {!loading && nextTrip && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-2xl border-2 border-grey-200 bg-white shadow-sm"
        >
          <div className="border-b border-grey-100 bg-grey-50/80 px-5 py-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-grey-500">
              {nextTrip.status === "active" ? "Trajet en cours" : "Prochain trajet"}
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <MapPin className="h-4 w-4 text-accent" />
                  <div className="w-px flex-1 bg-grey-200" style={{ minHeight: 20 }} />
                  <div className="h-2.5 w-2.5 rounded-full bg-brand" />
                </div>
                <div>
                  <p className="font-semibold text-grey-900">{nextTrip.from}</p>
                  <p className="text-[14px] text-grey-500">{nextTrip.to}</p>
                  <div className="mt-2 flex items-center gap-3 text-[13px] text-grey-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {nextTrip.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {nextTrip.time}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-grey-100 px-2 py-0.5 text-[12px] font-medium text-grey-700">
                      {nextTrip.vehicle}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {nextTrip.driver.rating} · {nextTrip.driver.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <p className="font-sans text-[22px] font-bold text-accent">
                  {formatFcfa(nextTrip.price)} <span className="text-[12px] font-normal text-grey-400">FCFA</span>
                </p>
                <Link
                  href={nextTrip.status === "active" ? `/suivi/${nextTrip.id}` : "/mon-compte/reservations"}
                  className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 font-sans text-[13px] font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  {nextTrip.status === "active" ? "Suivre en direct" : "Voir la réservation"}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Stats rapides (style Uber) */}
      {!loading && (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Trajets ce mois", value: tripsThisMonth, icon: Car, href: "/mon-compte/reservations" },
          { label: "Locations", value: rentalsCount, icon: CarFront, href: "/mon-compte/locations" },
        ].map(({ label, value, icon: Icon, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={href}
              className={cn(
                "flex flex-col gap-2 rounded-2xl border-2 border-grey-200 bg-white p-4 transition-all",
                "hover:border-accent/40 hover:shadow-md hover:shadow-grey-900/5"
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="h-4.5 w-4.5 text-accent" />
              </div>
              <p className="font-sans text-[22px] font-bold text-grey-900">{value}</p>
              <p className="text-[12px] font-medium text-grey-500">{label}</p>
            </Link>
          </motion.div>
        ))}
      </div>
      )}

      {/* Trajets récents + Locations récentes côte à côte / empilés */}
      {!loading && (
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Trajets récents */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border-2 border-grey-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-grey-100 px-5 py-4">
            <h2 className="font-sans text-[17px] font-bold text-grey-900">Trajets récents</h2>
            <Link
              href="/mon-compte/reservations"
              className="flex items-center gap-0.5 text-[13px] font-semibold text-accent hover:underline"
            >
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-grey-100">
            {recentTrips.length === 0 ? (
              <div className="px-5 py-10 text-center text-[14px] text-grey-500">
                Aucun trajet passé.{" "}
                <Link href="/commander" className="font-semibold text-accent hover:underline">
                  Réserver un trajet
                </Link>
              </div>
            ) : (
              recentTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href="/mon-compte/reservations"
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-grey-50/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-grey-900">{trip.from} → {trip.to}</p>
                    <p className="text-[12px] text-grey-500">{trip.date} · {trip.vehicle}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sans font-bold text-accent">{formatFcfa(trip.price)} FCFA</p>
                    <p className="text-[11px] text-grey-400">{trip.id}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-grey-300" />
                </Link>
              ))
            )}
          </div>
        </motion.section>

        {/* Locations récentes */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border-2 border-grey-200 bg-white"
        >
          <div className="flex items-center justify-between border-b border-grey-100 px-5 py-4">
            <h2 className="font-sans text-[17px] font-bold text-grey-900">Locations récentes</h2>
            <Link
              href="/mon-compte/locations"
              className="flex items-center gap-0.5 text-[13px] font-semibold text-accent hover:underline"
            >
              Voir tout
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-grey-100">
            {recentRentals.length === 0 ? (
              <div className="px-5 py-10 text-center text-[14px] text-grey-500">
                Aucune location.{" "}
                <Link href="/location" className="font-semibold text-accent hover:underline">
                  Louer un véhicule
                </Link>
              </div>
            ) : (
              recentRentals.map((loc) => (
                <Link
                  key={loc.id}
                  href="/mon-compte/locations"
                  className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-grey-50/80"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-grey-900">{loc.vehicle}</p>
                    <p className="text-[12px] text-grey-500">{loc.period} · {loc.startDate}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-sans font-bold text-accent">{formatFcfa(loc.price)} FCFA</p>
                    <p className="text-[11px] text-grey-400">{loc.vehicle}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-grey-300" />
                </Link>
              ))
            )}
          </div>
        </motion.section>
      </div>
      )}

      {/* Actions rapides (style Uber) */}
      {!loading && (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-wrap gap-4"
      >
        <Link href="/commander">
          <motion.span
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-accent bg-accent px-6 py-4 font-sans text-[15px] font-bold text-brand shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light"
          >
            <Car className="h-5 w-5" />
            Réserver un trajet
          </motion.span>
        </Link>
        <Link href="/location">
          <motion.span
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-grey-200 bg-white px-6 py-4 font-sans text-[15px] font-bold text-grey-800 transition-colors hover:border-grey-300 hover:bg-grey-50"
          >
            <CarFront className="h-5 w-5 text-grey-600" />
            Louer un véhicule
          </motion.span>
        </Link>
      </motion.div>
      )}
    </div>
  );
}
