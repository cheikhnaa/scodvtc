"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import * as Dialog from "@radix-ui/react-dialog";
import {
  CarFront,
  Calendar,
  Edit2,
  XCircle,
  RotateCcw,
  FileText,
  Eye,
  Plus,
  X,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CONTACT } from "@/lib/constants";

const DRIVER_PHONE = CONTACT.phone.replace(/\D/g, "").replace(/^221/, "221");

type RentalStatus = "upcoming" | "active" | "done" | "cancelled";

interface Rental {
  id:        string;
  booking_ref?: string;
  status:    RentalStatus;
  vehicle:   string;
  period:    string;
  startDate: string;
  endDate:   string;
  price:     number;
  currency:  string;
  driver?:   { initials: string; name: string; phone?: string };
}

function mapApiRowToRental(row: Record<string, unknown>): Rental {
  const status = ["upcoming", "active", "done", "cancelled"].includes(String(row.status))
    ? (row.status as RentalStatus)
    : "upcoming";
  const startDate = String(row.start_date ?? "");
  const endDate = String(row.end_date ?? "");
  return {
    id: String(row.id),
    booking_ref: typeof row.booking_ref === "string" ? row.booking_ref : undefined,
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
    driver: { initials: "—", name: "À assigner" },
  };
}

const TABS: { id: RentalStatus; label: string }[] = [
  { id: "upcoming", label: "À venir" },
  { id: "active", label: "En cours" },
  { id: "done", label: "Passées" },
  { id: "cancelled", label: "Annulées" },
];

const STATUS_CONFIG: Record<RentalStatus, { label: string; cls: string; dot?: string }> = {
  upcoming:  { label: "Confirmée", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  active:    { label: "En cours",  cls: "bg-blue-100 text-blue-700",   dot: "bg-blue-500" },
  done:      { label: "Terminée",  cls: "bg-grey-100 text-grey-600" },
  cancelled: { label: "Annulée",   cls: "bg-red-100 text-red-600" },
};

function StatusBadge({ status }: { status: RentalStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        cfg.cls
      )}
    >
      {cfg.dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            cfg.dot,
            status === "active" && "animate-pulse"
          )}
        />
      )}
      {cfg.label}
    </span>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  primary,
  danger,
  href,
  external,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  primary?: boolean;
  danger?: boolean;
  href?: string;
  external?: boolean;
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
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </a>
      );
    }
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

function RentalCard({
  rental,
  onCancel,
  onPrintReceipt,
  onShowDetail,
}: {
  rental: Rental;
  onCancel: (r: Rental) => void;
  onPrintReceipt: (r: Rental) => void;
  onShowDetail: (r: Rental) => void;
}) {
  const { status } = rental;
  const whatsappHref = `https://wa.me/${rental.driver?.phone ?? DRIVER_PHONE}`;

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
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <CarFront className="h-6 w-6 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[17px] font-bold text-brand">{rental.vehicle}</p>
              <p className="text-[14px] text-grey-600">{rental.period}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-grey-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {rental.startDate}
                  {rental.startDate !== rental.endDate && ` → ${rental.endDate}`}
                </span>
              </div>
              {rental.driver && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                    {rental.driver.initials}
                  </div>
                  <span className="text-[12px] font-medium text-grey-600">
                    Chauffeur : {rental.driver.name}
                  </span>
                </div>
              )}
              <p className="mt-1 text-[12px] text-grey-400">{rental.booking_ref ?? rental.id}</p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
            <div className="text-right">
              <p className="font-sans text-[20px] font-bold text-accent">
                {rental.price.toLocaleString("fr-FR")}
              </p>
              <p className="text-[11px] font-medium text-grey-400">{rental.currency}</p>
            </div>
            <StatusBadge status={status} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-grey-100 pt-4">
          {status === "upcoming" && (
            <>
              <ActionBtn icon={Edit2} label="Modifier" href="/location" />
              <ActionBtn icon={XCircle} label="Annuler" danger onClick={() => onCancel(rental)} />
            </>
          )}
          {status === "active" && (
            <ActionBtn icon={FileText} label="Contacter le chauffeur" primary href={whatsappHref} external />
          )}
          {status === "done" && (
            <>
              <ActionBtn icon={RotateCcw} label="Relouer" href="/location" />
              <ActionBtn icon={FileText} label="Voir le reçu" onClick={() => onPrintReceipt(rental)} />
            </>
          )}
          {status === "cancelled" && (
            <>
              <ActionBtn icon={RotateCcw} label="Relouer" href="/location" />
              <ActionBtn icon={Eye} label="Voir les détails" onClick={() => onShowDetail(rental)} />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DetailModal({ rental, open, onClose }: { rental: Rental | null; open: boolean; onClose: () => void }) {
  if (!rental) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">
              Détails · {rental.booking_ref ?? rental.id}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-grey-400 hover:bg-grey-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-3 text-[14px]">
            <p><span className="font-semibold text-grey-500">Véhicule :</span> {rental.vehicle}</p>
            <p><span className="font-semibold text-grey-500">Période :</span> {rental.period}</p>
            <p><span className="font-semibold text-grey-500">Dates :</span> {rental.startDate} → {rental.endDate}</p>
            {rental.driver && <p><span className="font-semibold text-grey-500">Chauffeur :</span> {rental.driver.name}</p>}
            <p><span className="font-semibold text-grey-500">Montant :</span> {rental.price.toLocaleString("fr-FR")} {rental.currency}</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptPrint({ rental, open, onClose }: { rental: Rental | null; open: boolean; onClose: () => void }) {
  if (!rental) return null;
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-grey-200 bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-sans text-[18px] font-bold text-grey-900">Reçu de location</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1.5 text-grey-400 hover:bg-grey-100">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-2 text-[14px] print:block">
            <p className="font-sans text-[20px] font-bold text-brand">SCOD VTC</p>
            <p className="text-grey-500">Reçu location · {rental.booking_ref ?? rental.id}</p>
            <hr className="my-3 border-grey-200" />
            <p><strong>Véhicule :</strong> {rental.vehicle}</p>
            <p><strong>Période :</strong> {rental.period}</p>
            <p><strong>Dates :</strong> {rental.startDate} {rental.startDate !== rental.endDate ? `→ ${rental.endDate}` : ""}</p>
            <p><strong>Montant :</strong> {rental.price.toLocaleString("fr-FR")} {rental.currency}</p>
            <hr className="my-3 border-grey-200" />
            <p className="text-[12px] text-grey-400">Merci pour votre confiance.</p>
          </div>
          <div className="mt-6 flex gap-2 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
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

function EmptyState({ tab }: { tab: string }) {
  const messages: Record<string, string> = {
    upcoming: "Aucune location à venir.",
    active:   "Aucune location en cours.",
    done:     "Aucune location passée.",
    cancelled: "Aucune location annulée.",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-grey-200 bg-white py-20 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-grey-100">
        <CarFront className="h-10 w-10 text-grey-400" />
      </div>
      <div>
        <p className="font-sans text-[18px] font-bold text-grey-900">
          {messages[tab] ?? "Aucune location"}
        </p>
        <p className="mt-1 text-[13.5px] text-grey-500">
          Vos locations avec chauffeur apparaîtront ici.
        </p>
      </div>
      <Link href="/location">
        <motion.span
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-accent px-6 py-2.5 font-bold text-[14px] text-brand shadow-lg shadow-accent/20 transition-colors hover:bg-accent-light"
        >
          <Plus className="h-4 w-4" />
          Louer un véhicule
        </motion.span>
      </Link>
    </motion.div>
  );
}

export default function LocationsPage() {
  const [active, setActive] = useState<string>("upcoming");
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detailRental, setDetailRental] = useState<Rental | null>(null);
  const [receiptRental, setReceiptRental] = useState<Rental | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchError(null);
      try {
        const res = await fetch("/api/rentals", {
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const data = (await res.json()) as { rentals?: unknown[]; error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setRentals([]);
          setFetchError(
            data?.error ?? (res.status === 401 ? "Connectez-vous pour voir vos locations." : "Impossible de charger les locations.")
          );
          return;
        }
        const list = Array.isArray(data?.rentals) ? data.rentals : [];
        setRentals(list.map((row: Record<string, unknown>) => mapApiRowToRental(row)));
      } catch {
        if (!cancelled) {
          setRentals([]);
          setFetchError("Impossible de charger les locations.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = rentals.filter((r) => r.status === active);

  const handleCancel = (rental: Rental) => {
    if (typeof window !== "undefined" && !window.confirm("Annuler cette location ? Cette action est définitive.")) return;
    setRentals((prev) =>
      prev.map((r) => (r.id === rental.id ? { ...r, status: "cancelled" as const } : r))
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="font-sans text-[24px] font-bold text-grey-900">Mes locations</h2>
        <p className="mt-1 text-[14px] text-grey-500">
          {loading ? "Chargement…" : `${rentals.length} location${rentals.length !== 1 ? "s" : ""} au total`}
        </p>
      </div>

      {fetchError && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-grey-200 bg-white py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-[14px] text-grey-500">Chargement de vos locations…</p>
        </div>
      ) : (
      <>
      <Tabs.Root value={active} onValueChange={setActive}>
        <Tabs.List className="mb-6 flex gap-0 overflow-x-auto border-b border-grey-200">
          {TABS.map(({ id, label }) => {
            const count = rentals.filter((r) => r.status === id).length;
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
                    layoutId="locations-tab-underline"
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
                  {filtered.map((r) => (
                    <RentalCard
                      key={r.id}
                      rental={r}
                      onCancel={handleCancel}
                      onPrintReceipt={(rental) => setReceiptRental(rental)}
                      onShowDetail={(rental) => setDetailRental(rental)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </Tabs.Content>
        ))}
      </Tabs.Root>
      <DetailModal rental={detailRental} open={!!detailRental} onClose={() => setDetailRental(null)} />
      <ReceiptPrint rental={receiptRental} open={!!receiptRental} onClose={() => setReceiptRental(null)} />
      </>
      )}
    </div>
  );
}
