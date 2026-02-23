"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import {
  MapPin, Circle, Star, Eye, RotateCcw,
  XCircle, Navigation, FileText, Edit2, Plus, X, Printer,
} from "lucide-react";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────────────────
   Types & mock data
───────────────────────────────────────────────────────── */

type BookingStatus = "upcoming" | "active" | "done" | "cancelled";

interface Booking {
  id:        string;
  booking_ref?: string;
  status:    BookingStatus;
  date:      string;
  time:      string;
  from:      string;
  to:        string;
  vehicle:   string;
  driver:    { initials: string; name: string; rating: number };
  price:     number;
  currency:  string;
}

const VEHICLE_LABELS: Record<string, string> = {
  confort: "Confort",
  premium: "Premium",
  vip: "VIP",
};

function mapApiRowToBooking(row: {
  id: string;
  booking_ref: string;
  pickup_address: string;
  dropoff_address: string;
  scheduled_date: string;
  scheduled_time: string;
  vehicle_class: string;
  total_amount: number;
  status: string;
}): Booking {
  const status = ["upcoming", "active", "done", "cancelled"].includes(row.status)
    ? (row.status as BookingStatus)
    : "upcoming";
  return {
    id: row.id,
    booking_ref: row.booking_ref,
    status,
    date: new Date(row.scheduled_date + "Z").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: row.scheduled_time,
    from: row.pickup_address,
    to: row.dropoff_address,
    vehicle: VEHICLE_LABELS[row.vehicle_class] ?? row.vehicle_class,
    driver: { initials: "—", name: "À assigner", rating: 0 },
    price: row.total_amount,
    currency: "FCFA",
  };
}

const TABS: { id: BookingStatus | "all"; label: string }[] = [
  { id: "upcoming",  label: "À venir" },
  { id: "active",    label: "En cours" },
  { id: "done",      label: "Passées" },
  { id: "cancelled", label: "Annulées" },
];

/* ─────────────────────────────────────────────────────────
   Status badge
───────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<BookingStatus, { label: string; cls: string; dot?: string }> = {
  upcoming:  { label: "Confirmée",  cls: "bg-green-100 text-green-700",  dot: "bg-green-500" },
  active:    { label: "En cours",   cls: "bg-blue-100 text-blue-700",    dot: "bg-blue-500" },
  done:      { label: "Terminée",   cls: "bg-grey-100 text-grey-600" },
  cancelled: { label: "Annulée",    cls: "bg-red-100 text-red-600" },
};

const VEHICLE_OPTIONS = [
  "Peugeot 3008",
  "BMW Série 5",
  "Mercedes Classe S",
  "Tesla Model S",
];

function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider", cfg.cls)}>
      {cfg.dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot, status === "active" && "animate-pulse")} />
      )}
      {cfg.label}
    </span>
  );
}

const commanderUrl = (from: string, to: string) =>
  `/commander?pickup=${encodeURIComponent(from)}&dropoff=${encodeURIComponent(to)}`;

/* ─────────────────────────────────────────────────────────
   Action button (link or button)
───────────────────────────────────────────────────────── */

function ActionBtn({
  icon: Icon,
  label,
  primary,
  danger,
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  primary?: boolean;
  danger?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-150",
    primary
      ? "border-accent bg-accent text-brand hover:bg-accent-light"
      : danger
        ? "border-red-200 text-red-500 hover:bg-red-50"
        : "border-grey-200 text-grey-600 hover:border-grey-300 hover:bg-grey-50"
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────
   Booking card
───────────────────────────────────────────────────────── */

function BookingCard({
  booking,
  onCancel,
  onEdit,
  onPrintReceipt,
  onShowDetail,
}: {
  booking: Booking;
  onCancel: (b: Booking) => void;
  onEdit: (b: Booking) => void;
  onPrintReceipt: (b: Booking) => void;
  onShowDetail: (b: Booking) => void;
}) {
  const { status } = booking;
  const rebookHref = commanderUrl(booking.from, booking.to);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border-2 border-grey-200 bg-white transition-shadow hover:shadow-lg hover:shadow-grey-900/5"
    >
      {status === "active" && (
        <div className="h-1 w-full bg-gradient-to-r from-accent via-accent-light to-accent animate-[shimmer_2s_linear_infinite]" />
      )}

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="flex flex-col items-center gap-1 pt-1">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <div className="w-px flex-1 bg-grey-200" style={{ minHeight: 28 }} />
              <Circle className="h-3.5 w-3.5 shrink-0 text-brand fill-brand" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="mb-3 flex items-center gap-2">
                <p className="font-sans text-[17px] font-bold text-brand">{booking.date}</p>
                <span className="rounded-lg bg-grey-100 px-2 py-0.5 font-sans text-[13px] font-bold text-grey-700">
                  {booking.time}
                </span>
              </div>
              <p className="text-[14px] font-semibold text-grey-900">{booking.from}</p>
              <p className="text-[14px] text-grey-500">{booking.to}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-[12px] font-medium text-grey-500">{booking.vehicle}</span>
                <span className="h-1 w-1 rounded-full bg-grey-300" />
                <div className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand font-sans text-[8px] font-bold text-white">
                    {booking.driver.initials}
                  </div>
                  <span className="text-[12px] font-medium text-grey-600">{booking.driver.name}</span>
                  <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {booking.driver.rating}
                  </span>
                </div>
                <span className="h-1 w-1 rounded-full bg-grey-300" />
                <span className="text-[12px] text-grey-400">{booking.booking_ref ?? booking.id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
            <div className="text-right">
              <p className="font-sans text-[20px] font-bold text-accent">
                {booking.price.toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] font-medium text-grey-400">{booking.currency}</p>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-grey-100 pt-4">
          {status === "upcoming" && (
            <>
              <ActionBtn icon={Edit2} label="Modifier" onClick={() => onEdit(booking)} />
              <ActionBtn icon={XCircle} label="Annuler" danger onClick={() => onCancel(booking)} />
            </>
          )}
          {status === "active" && (
            <ActionBtn icon={Navigation} label="Suivre en direct" primary href={`/suivi/${booking.id}`} />
          )}
          {status === "done" && (
            <>
              <ActionBtn icon={RotateCcw} label="Rebook" href={rebookHref} />
              <ActionBtn icon={FileText} label="Voir le reçu" onClick={() => onPrintReceipt(booking)} />
            </>
          )}
          {status === "cancelled" && (
            <>
              <ActionBtn icon={RotateCcw} label="Rebook" href={rebookHref} />
              <ActionBtn icon={Eye} label="Voir les détails" onClick={() => onShowDetail(booking)} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Edit reservation modal
───────────────────────────────────────────────────────── */

function EditReservationModal({
  booking,
  open,
  onClose,
  onSave,
}: {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onSave: (updated: Booking) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicle, setVehicle] = useState("");

  useEffect(() => {
    if (booking && open) {
      setFrom(booking.from);
      setTo(booking.to);
      setDate(booking.date);
      setTime(booking.time);
      setVehicle(booking.vehicle);
    }
  }, [booking, open]);

  if (!booking) return null;

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim() || !date.trim() || !time.trim() || !vehicle.trim()) return;
    onSave({
      ...booking,
      from: from.trim(),
      to: to.trim(),
      date: date.trim(),
      time: time.trim(),
      vehicle: vehicle.trim(),
    });
    onClose();
  };

  const inputCls = "h-11 w-full rounded-xl border-2 border-grey-200 px-3 text-[14px] outline-none focus:border-accent focus:shadow-lg focus:shadow-accent/10";

  return (
    <Dialog.Root open={open} onOpenChange={handleOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl"
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">
              Modifier la réservation · {booking.booking_ref ?? booking.id}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-grey-400 hover:bg-grey-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-grey-700">Lieu de prise en charge</label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-grey-700">Destination</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-grey-700">Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="ex. Lun 24 Fév 2026"
                  className={inputCls}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-grey-700">Heure</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="ex. 08:30"
                  className={inputCls}
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-grey-700">Véhicule</label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">Choisir...</option>
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border-2 border-grey-200 py-2.5 text-[14px] font-semibold text-grey-700 hover:bg-grey-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 rounded-xl bg-accent py-2.5 text-[14px] font-bold text-brand shadow-lg shadow-accent/20 hover:bg-accent-light"
              >
                Enregistrer les modifications
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─────────────────────────────────────────────────────────
   Detail modal & Receipt print
───────────────────────────────────────────────────────── */

function ConfirmCancelModal({
  booking,
  open,
  onClose,
  onConfirm,
}: {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (booking: Booking) => void;
}) {
  if (!booking) return null;
  const handleConfirm = () => {
    onConfirm(booking);
    onClose();
  };
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl">
          <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">
            Annuler cette réservation ?
          </Dialog.Title>
          <p className="mt-2 text-[14px] text-grey-600">
            {booking.from} → {booking.to} · {booking.date}
          </p>
          <p className="mt-3 text-[13px] text-grey-500">
            Cette action est définitive. La réservation passera dans l’onglet « Annulées ».
          </p>
          <div className="mt-6 flex gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="flex-1 rounded-xl border-2 border-grey-200 py-2.5 text-[14px] font-semibold text-grey-700 hover:bg-grey-50"
              >
                Garder
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-[14px] font-bold text-white hover:bg-red-600"
            >
              Oui, annuler
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DetailModal({ booking, open, onClose }: { booking: Booking | null; open: boolean; onClose: () => void }) {
  if (!booking) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">
              Détails · {booking.booking_ref ?? booking.id}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-grey-400 hover:bg-grey-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-3 text-[14px]">
            <p><span className="font-semibold text-grey-500">Trajet :</span> {booking.from} → {booking.to}</p>
            <p><span className="font-semibold text-grey-500">Date :</span> {booking.date} à {booking.time}</p>
            <p><span className="font-semibold text-grey-500">Véhicule :</span> {booking.vehicle}</p>
            <p><span className="font-semibold text-grey-500">Chauffeur :</span> {booking.driver.name} (★ {booking.driver.rating})</p>
            <p><span className="font-semibold text-grey-500">Montant :</span> {booking.price.toLocaleString("fr-FR")} {booking.currency}</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptPrint({ booking, open, onClose }: { booking: Booking | null; open: boolean; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  if (!booking) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">Reçu</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-grey-400 hover:bg-grey-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div ref={printRef} className="space-y-2 text-[14px] print:block">
            <p className="font-sans text-[20px] font-bold text-brand">SCOD VTC</p>
            <p className="text-grey-500">Reçu de course · {booking.booking_ref ?? booking.id}</p>
            <hr className="my-3 border-grey-200" />
            <p><strong>Départ :</strong> {booking.from}</p>
            <p><strong>Arrivée :</strong> {booking.to}</p>
            <p><strong>Date :</strong> {booking.date} à {booking.time}</p>
            <p><strong>Véhicule :</strong> {booking.vehicle}</p>
            <p><strong>Montant :</strong> {booking.price.toLocaleString("fr-FR")} {booking.currency}</p>
            <hr className="my-3 border-grey-200" />
            <p className="text-[12px] text-grey-400">Merci pour votre confiance.</p>
          </div>
          <div className="mt-6 flex gap-2 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-2.5 font-bold text-[14px] text-brand hover:bg-accent-light"
            >
              <Printer className="h-4 w-4" />
              Imprimer le reçu
            </button>
            <Dialog.Close asChild>
              <button className="rounded-xl border-2 border-grey-200 px-4 py-2.5 text-[14px] font-semibold text-grey-700 hover:bg-grey-50">
                Fermer
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ─────────────────────────────────────────────────────────
   Empty state
───────────────────────────────────────────────────────── */

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, string> = {
    upcoming:  "Aucune réservation à venir.",
    active:    "Aucune course en cours.",
    done:      "Aucun trajet passé.",
    cancelled: "Aucune réservation annulée.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-grey-200 bg-white py-20 text-center"
    >
      {/* SVG illustration */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden>
        <circle cx="40" cy="40" r="40" fill="#F4F4F5" />
        <path d="M24 48h32M24 52h20" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
        <rect x="28" y="26" width="24" height="16" rx="3" fill="#E5E7EB" />
        <rect x="32" y="30" width="8" height="2" rx="1" fill="#9CA3AF" />
        <rect x="32" y="34" width="12" height="2" rx="1" fill="#9CA3AF" />
        <circle cx="52" cy="28" r="7" fill="#FFC300" />
        <path d="M52 25v4M52 31v1" stroke="#110E40" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      <div>
        <p className="font-sans text-[18px] font-bold text-grey-900">
          {messages[tab] ?? "Aucune réservation"}
        </p>
        <p className="mt-1 text-[13.5px] text-grey-500">
          Vos courses apparaîtront ici une fois réservées.
        </p>
      </div>

      <Link href="/commander">
        <motion.span
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-bold text-[14px] text-brand shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light"
        >
          <Plus className="h-4 w-4" />
          Réservez votre premier trajet
        </motion.span>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────── */

export default function ReservationsPage() {
  const [active, setActive] = useState<string>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = async () => {
    try {
      const res = await fetch(`/api/bookings?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      });
      const data = (await res.json()) as { bookings?: unknown[]; error?: string };
      if (!res.ok) {
        setBookings([]);
        setFetchError(
          data?.error ?? (res.status === 401 ? "Connectez-vous pour voir vos réservations." : "Impossible de charger les réservations.")
        );
        return;
      }
      const list = Array.isArray(data?.bookings) ? data.bookings : [];
      setBookings(
        list.map((row: Record<string, unknown>) =>
          mapApiRowToBooking({
            id: String(row.id),
            booking_ref: String(row.booking_ref ?? ""),
            pickup_address: String(row.pickup_address ?? ""),
            dropoff_address: String(row.dropoff_address ?? ""),
            scheduled_date: String(row.scheduled_date ?? ""),
            scheduled_time: String(row.scheduled_time ?? ""),
            vehicle_class: String(row.vehicle_class ?? "confort"),
            total_amount: Number(row.total_amount ?? 0),
            status: String(row.status ?? "upcoming"),
          })
        )
      );
      setFetchError(null);
    } catch {
      setBookings([]);
      setFetchError("Impossible de charger les réservations.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      await loadBookings();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onFocus = () => loadBookings();
    if (typeof window === "undefined") return;
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const filtered = bookings.filter((b) => b.status === active);

  const handleCancelConfirm = async (booking: Booking) => {
    setCancelBooking(null);
    setCancellingId(booking.id);
    setFetchError(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setFetchError(data?.error ?? "Impossible d'annuler la réservation.");
        setCancellingId(null);
        return;
      }
      await loadBookings();
    } catch {
      setFetchError("Impossible d'annuler la réservation. Réessayez.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleSaveEdit = (updated: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-sans text-[24px] font-bold text-grey-900">Mes réservations</h2>
        <p className="mt-1 text-[14px] text-grey-500">
          {loading ? "Chargement…" : `${bookings.length} course${bookings.length !== 1 ? "s" : ""} au total`}
        </p>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-grey-200 bg-white py-20 text-[14px] text-grey-500">
          Chargement de vos réservations…
        </div>
      ) : (
      <>
      <Tabs.Root value={active} onValueChange={setActive}>
        <Tabs.List className="mb-6 flex gap-0 overflow-x-auto border-b border-grey-200">
          {TABS.map(({ id, label }) => {
            const count = bookings.filter((b) => b.status === id).length;
            return (
              <Tabs.Trigger
                key={id}
                value={id}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 px-4 py-3 text-[14px] font-medium transition-colors",
                  "focus-visible:outline-none",
                  active === id ? "font-semibold text-brand" : "text-grey-500 hover:text-grey-800"
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      active === id ? "bg-accent text-brand" : "bg-grey-100 text-grey-500"
                    )}
                  >
                    {count}
                  </span>
                )}
                {active === id && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  />
                )}
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        {TABS.map(({ id }) => (
          <Tabs.Content key={id} value={id} className="outline-none">
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <EmptyState key="empty" tab={id} />
              ) : (
                <motion.div
                  key="list"
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {filtered.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onCancel={(b) => setCancelBooking(b)}
                      onEdit={(b) => setEditBooking(b)}
                      onPrintReceipt={(b) => setReceiptBooking(b)}
                      onShowDetail={(b) => setDetailBooking(b)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs.Content>
        ))}
      </Tabs.Root>

      <DetailModal booking={detailBooking} open={!!detailBooking} onClose={() => setDetailBooking(null)} />
      <ReceiptPrint booking={receiptBooking} open={!!receiptBooking} onClose={() => setReceiptBooking(null)} />
      <ConfirmCancelModal
        booking={cancelBooking}
        open={!!cancelBooking}
        onClose={() => setCancelBooking(null)}
        onConfirm={handleCancelConfirm}
      />
      <EditReservationModal
        booking={editBooking}
        open={!!editBooking}
        onClose={() => setEditBooking(null)}
        onSave={handleSaveEdit}
      />
      </>
      )}
    </div>
  );
}
