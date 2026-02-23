"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Smartphone, Wallet, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  calculatePrice,
  formatFcfa,
  type ReservationData,
  type PaymentMethodId,
} from "../reservation-types";

// ─── Payment method definitions ───────────────────────────────────────────────

interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: "mobile-money" | "card" | "other";
  provider: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  // Mobile Money (PayTech)
  {
    id: "orange-money",
    name: "Orange Money",
    description: "Paiement sécurisé via Orange Money",
    icon: <Smartphone className="h-5 w-5" />,
    category: "mobile-money",
    provider: "PayTech",
  },
  {
    id: "wave",
    name: "Wave",
    description: "Paiement rapide et gratuit",
    icon: <Smartphone className="h-5 w-5" />,
    category: "mobile-money",
    provider: "PayTech",
  },
  // Other
  {
    id: "cash",
    name: "Espèces",
    description: "Paiement au chauffeur en fin de course",
    icon: <Wallet className="h-5 w-5" />,
    category: "other",
    provider: "Direct",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  "mobile-money": "Mobile Money (PayTech)",
  other: "Autres moyens de paiement",
};

// ─── Payment method card ──────────────────────────────────────────────────────

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}

function PaymentMethodCard({ method, selected, onSelect }: PaymentMethodCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-accent bg-accent-soft shadow-[0_0_0_1px_#FFC300]"
          : "border-grey-200 bg-white hover:border-grey-300 hover:bg-grey-50"
      )}
      aria-pressed={selected}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-accent text-brand" : "bg-grey-100 text-grey-500"
        )}
      >
        {method.icon}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "font-sans text-base font-bold transition-colors",
            selected ? "text-brand" : "text-grey-900"
          )}
        >
          {method.name}
        </p>
        <p className="mt-0.5 font-sans text-xs text-grey-500">{method.description}</p>
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
          selected ? "border-accent bg-accent" : "border-grey-300 bg-white"
        )}
      >
        {selected && <Check className="h-3 w-3 text-brand" strokeWidth={3} />}
      </div>
    </motion.button>
  );
}

// ─── Step component ───────────────────────────────────────────────────────────

interface StepPaymentProps {
  data: ReservationData;
  onSelectMethod: (method: PaymentMethodId) => void;
  isProcessing: boolean;
}

export function StepPayment({ data, onSelectMethod, isProcessing }: StepPaymentProps) {
  const price = calculatePrice(
    data.vehicleClass,
    data.distanceKm,
    data.time,
    data.pickup.address,
    data.dropoff.address
  );

  const groupedMethods = React.useMemo(() => {
    const groups: Record<string, PaymentMethod[]> = {
      "mobile-money": [],
      other: [],
    };
    PAYMENT_METHODS.forEach((m) => {
      if (groups[m.category]) groups[m.category].push(m);
    });
    return groups;
  }, []);

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === data.paymentMethod);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-sans text-2xl font-bold text-grey-900 md:text-3xl">
          Paiement
        </h2>
        <p className="mt-1 font-sans text-sm text-grey-500">
          Acompte de {formatFcfa(price.deposit)} FCFA pour confirmer (30%)
        </p>
      </div>

      {/* Payment methods grouped by category */}
      <div className="space-y-6">
        {Object.entries(groupedMethods).map(([category, methods]) => (
          <div key={category}>
            <p className="mb-3 font-sans text-xs font-bold uppercase tracking-widest text-grey-400">
              {CATEGORY_LABELS[category]}
            </p>
            <div className="flex flex-col gap-2">
              {methods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  selected={data.paymentMethod === method.id}
                  onSelect={() => onSelectMethod(method.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Payment summary */}
      <div className="rounded-xl border border-grey-100 bg-gradient-to-br from-brand/5 to-accent/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-grey-600">Acompte à régler</p>
            <p className="mt-0.5 font-sans text-3xl font-bold text-brand">
              {formatFcfa(price.deposit)}{" "}
              <span className="font-sans text-base font-400 text-grey-500">FCFA</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-sans text-xs text-grey-500">Total course</p>
            <p className="font-sans text-lg font-bold text-grey-700">
              {formatFcfa(price.total)} FCFA
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/60 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p className="font-sans text-xs text-grey-600">
            Le solde de{" "}
            <span className="font-bold">{formatFcfa(price.total - price.deposit)} FCFA</span>{" "}
            sera réglé en fin de course
            {data.paymentMethod === "cash"
              ? " en espèces au chauffeur"
              : " via le même moyen de paiement"}.
          </p>
        </div>
      </div>

      {/* Terms */}
      <div className="rounded-xl border border-grey-100 bg-grey-50 p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-grey-300 text-accent focus:ring-2 focus:ring-accent/20"
            defaultChecked
          />
          <label htmlFor="terms" className="cursor-pointer font-sans text-sm text-grey-600">
            J&apos;accepte les{" "}
            <a href="/legal/cgv" className="font-semibold text-brand hover:underline">
              conditions générales de vente
            </a>{" "}
            et la{" "}
            <a
              href="/legal/confidentialite"
              className="font-semibold text-brand hover:underline"
            >
              politique de confidentialité
            </a>
            . J&apos;ai compris la politique d&apos;annulation.
          </label>
        </div>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 rounded-xl bg-accent/10 py-4"
        >
          <Loader2 className="h-5 w-5 animate-spin text-brand" />
          <p className="font-sans text-sm font-semibold text-brand">
            Traitement du paiement en cours…
          </p>
        </motion.div>
      )}
    </div>
  );
}
