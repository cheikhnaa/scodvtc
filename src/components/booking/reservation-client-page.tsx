"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { ReservationStepper } from "@/components/booking/reservation-stepper";
import { StepTrajet } from "@/components/booking/steps/step-trajet";
import { StepDatetime } from "@/components/booking/steps/step-datetime";
import { StepVehicle } from "@/components/booking/steps/step-vehicle";
import { StepRecap } from "@/components/booking/steps/step-recap";
import { StepPayment } from "@/components/booking/steps/step-payment";
import { SuccessScreen } from "@/components/booking/success-screen";
import {
  DEFAULT_RESERVATION,
  generateBookingRef,
  calculatePrice,
  type ReservationData,
  type AddressValue,
  type VehicleClass,
  type PaymentMethodId,
} from "@/components/booking/reservation-types";
import { nominatimSearch } from "@/lib/nominatim";

// ─── Haversine distance calculation ───────────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Slide transition variants ────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReservationClientPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pré-remplir depuis la page d'accueil / commander et décider de l'étape initiale
  const initial = React.useMemo(() => {
    const pickupAddr = searchParams.get("pickup");
    const dropoffAddr = searchParams.get("dropoff");
    const vehicle = searchParams.get("vehicle") as VehicleClass | null;
    const schedule = searchParams.get("schedule");
    const dateParam = searchParams.get("date");
    const timeParam = searchParams.get("time");
    const pickupLat = searchParams.get("pickup_lat");
    const pickupLng = searchParams.get("pickup_lng");
    const dropoffLat = searchParams.get("dropoff_lat");
    const dropoffLng = searchParams.get("dropoff_lng");

    const pickup: AddressValue = pickupAddr
      ? {
          address: pickupAddr,
          ...(pickupLat != null && pickupLng != null && { latitude: Number(pickupLat), longitude: Number(pickupLng) }),
        }
      : DEFAULT_RESERVATION.pickup;
    const dropoff: AddressValue = dropoffAddr
      ? {
          address: dropoffAddr,
          ...(dropoffLat != null && dropoffLng != null && { latitude: Number(dropoffLat), longitude: Number(dropoffLng) }),
        }
      : DEFAULT_RESERVATION.dropoff;

    // Normaliser la date (Hero envoie "today", "tomorrow" ou YYYY-MM-DD)
    let date = dateParam || DEFAULT_RESERVATION.date;
    if (dateParam === "today") {
      date = new Date().toISOString().split("T")[0];
    } else if (dateParam === "tomorrow") {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      date = d.toISOString().split("T")[0];
    }

    const time = timeParam || DEFAULT_RESERVATION.time;
    const isEarliest = schedule === "now" || (!dateParam && !timeParam);

    const fromCommander = searchParams.get("from_commander") === "1" && pickupAddr && dropoffAddr;
    const fromHome = searchParams.get("from_home") === "1" && pickupAddr && dropoffAddr;
    let startStep = 0;
    if (fromHome) startStep = 2;
    else if (fromCommander) startStep = 1;

    return {
      data: {
        ...DEFAULT_RESERVATION,
        pickup,
        dropoff,
        vehicleClass: vehicle || DEFAULT_RESERVATION.vehicleClass,
        date,
        time,
        isEarliest,
      } as ReservationData,
      startStep,
    };
  }, [searchParams]);

  const [currentStep, setCurrentStep] = React.useState(initial.startStep);
  const [direction, setDirection] = React.useState(0);
  const [data, setData] = React.useState<ReservationData>(initial.data);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [bookingRef, setBookingRef] = React.useState("");
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Update distance + duration when both addresses have coordinates
  React.useEffect(() => {
    if (
      data.pickup.latitude !== undefined &&
      data.pickup.longitude !== undefined &&
      data.dropoff.latitude !== undefined &&
      data.dropoff.longitude !== undefined
    ) {
      const distanceKm = haversineKm(
        data.pickup.latitude,
        data.pickup.longitude,
        data.dropoff.latitude,
        data.dropoff.longitude
      );
      const durationMin = Math.round(distanceKm * 2.5);
      setData((d) => ({ ...d, distanceKm, durationMin }));
    }
  }, [
    data.pickup.latitude,
    data.pickup.longitude,
    data.dropoff.latitude,
    data.dropoff.longitude,
  ]);

  // Géocoder les adresses venant de la page d'accueil (texte sans coordonnées) pour afficher la carte et la distance
  React.useEffect(() => {
    const needsPickupCoords = data.pickup.address && data.pickup.latitude == null;
    const needsDropoffCoords = data.dropoff.address && data.dropoff.latitude == null;
    if (!needsPickupCoords && !needsDropoffCoords) return;

    let cancelled = false;
    (async () => {
      try {
        const [pickupResults, dropoffResults] = await Promise.all([
          needsPickupCoords ? nominatimSearch(data.pickup.address, { countryCodes: "sn", limit: 1 }) : [],
          needsDropoffCoords ? nominatimSearch(data.dropoff.address, { countryCodes: "sn", limit: 1 }) : [],
        ]);
        if (cancelled) return;
        const pickup = needsPickupCoords && pickupResults[0]
          ? { ...data.pickup, latitude: Number(pickupResults[0].lat), longitude: Number(pickupResults[0].lon) }
          : data.pickup;
        const dropoff = needsDropoffCoords && dropoffResults[0]
          ? { ...data.dropoff, latitude: Number(dropoffResults[0].lat), longitude: Number(dropoffResults[0].lon) }
          : data.dropoff;
        if ((needsPickupCoords && pickup.latitude != null) || (needsDropoffCoords && dropoff.latitude != null)) {
          setData((d) => ({ ...d, pickup, dropoff }));
        }
      } catch {
        // Ignorer les erreurs de géocodage (carte restera sans tracé)
      }
    })();
    return () => { cancelled = true; };
  }, [data.pickup.address, data.dropoff.address]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const updateData = (fields: Partial<ReservationData>) => {
    setData((d) => ({ ...d, ...fields }));
    setErrors({});
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!data.pickup.address) newErrors.pickup = "Adresse de départ requise";
      if (!data.dropoff.address) newErrors.dropoff = "Adresse d'arrivée requise";
      if (!data.pickup.latitude || !data.dropoff.latitude)
        newErrors.pickup = "Veuillez sélectionner une adresse dans la liste";
    }

    if (step === 1) {
      if (!data.isEarliest && !data.date) newErrors.date = "Veuillez choisir une date";
      if (!data.isEarliest && !data.time) newErrors.time = "Veuillez choisir une heure";
    }

    if (step === 4) {
      if (!data.paymentMethod) {
        newErrors.payment = "Veuillez sélectionner un moyen de paiement";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (step: number) => {
    if (step < currentStep || validateStep(currentStep)) {
      setDirection(step > currentStep ? 1 : -1);
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      goToStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsProcessing(true);

    const ref = generateBookingRef();
    const price = calculatePrice(
      data.vehicleClass,
      data.distanceKm,
      data.time,
      data.pickup.address,
      data.dropoff.address
    );

    // 1. Enregistrer en base tout de suite (session = connectée) pour que la commande soit dans le tableau de bord
    try {
      const url = typeof window !== "undefined" ? `${window.location.origin}/api/bookings` : "/api/bookings";
      const saveRes = await fetch(url, {
        method: "POST",
        credentials: "include",
        mode: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_ref: ref,
          pickup_address: data.pickup.address,
          dropoff_address: data.dropoff.address,
          scheduled_date: data.date,
          scheduled_time: data.time,
          vehicle_class: data.vehicleClass,
          total_amount: price.total,
          deposit_amount: price.deposit,
        }),
      });
      if (!saveRes.ok) {
        const err = (await saveRes.json()) as { error?: string };
        console.warn("[Réservation] Enregistrement tableau de bord:", err?.error ?? saveRes.status);
      }
    } catch (e) {
      console.warn("[Réservation] Enregistrement tableau de bord:", e);
    }

    // 2. Simuler le paiement puis afficher le succès
    await new Promise((r) => setTimeout(r, 2000));

    setBookingRef(ref);
    setIsSuccess(true);
    setIsProcessing(false);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Success screen ─────────────────────────────────────────────────────────

  if (isSuccess) {
    const price = calculatePrice(
      data.vehicleClass,
      data.distanceKm,
      data.time,
      data.pickup.address,
      data.dropoff.address
    );
    return (
      <SuccessScreen
        bookingRef={bookingRef}
        data={data}
        totalAmount={price.total}
        depositAmount={price.deposit}
      />
    );
  }

  // ── Stepper flow ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-grey-50 pt-[68px]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stepper */}
        <div className="mb-10">
          <ReservationStepper currentStep={currentStep} />
        </div>

        {/* Step content with AnimatePresence */}
        <div className="overflow-hidden rounded-2xl border border-grey-100 bg-white shadow-xl">
          <div className="p-6 sm:p-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                {currentStep === 0 && (
                  <StepTrajet
                    data={data}
                    onPickupChange={(v: AddressValue) => updateData({ pickup: v })}
                    onDropoffChange={(v: AddressValue) => updateData({ dropoff: v })}
                    errors={errors}
                  />
                )}

                {currentStep === 1 && (
                  <StepDatetime data={data} onUpdate={updateData} errors={errors} />
                )}

                {currentStep === 2 && (
                  <StepVehicle
                    data={data}
                    onSelect={(vehicleClass: VehicleClass) =>
                      updateData({ vehicleClass })
                    }
                  />
                )}

                {currentStep === 3 && <StepRecap data={data} />}

                {currentStep === 4 && (
                  <StepPayment
                    data={data}
                    onSelectMethod={(method: PaymentMethodId) =>
                      updateData({ paymentMethod: method })
                    }
                    isProcessing={isProcessing}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between border-t border-grey-100 bg-grey-50 px-6 py-5 sm:px-10">
            <button
              type="button"
              onClick={handleBack}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 rounded-btn border-2 border-grey-200 bg-white px-5 py-3 font-sans text-sm font-bold text-grey-700 transition-all",
                "hover:border-grey-300 hover:bg-grey-50",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 0 ? "Annuler" : "Retour"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={isProcessing}
              className={cn(
                "flex items-center gap-2 rounded-btn bg-accent px-6 py-3 font-sans text-sm font-bold text-brand shadow-[0_4px_16px_rgba(255,195,0,0.3)] transition-all",
                "hover:bg-accent-light hover:shadow-[0_6px_20px_rgba(255,195,0,0.4)]",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/40"
              )}
            >
              {currentStep === 4 ? (
                <>
                  <Check className="h-4 w-4" />
                  Confirmer la réservation
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          {[
            "Paiement 100% sécurisé",
            "Annulation gratuite 24h",
            "Tarif fixe garanti",
          ].map((item) => (
            <span
              key={item}
              className="flex items-center gap-2 font-sans text-sm text-grey-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
