"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2, Building2, Hash, User, Phone, Mail, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const companySchema = z.object({
  company: z.string().min(2, "Nom d'entreprise requis"),
  ninea: z.string().optional(),
  name: z.string().min(2, "Nom du contact requis"),
  phone: z.string().min(9, "Téléphone invalide"),
  email: z.string().email("Email invalide"),
  employees: z.string().min(1, "Nombre de collaborateurs requis"),
});

type CompanyFormData = z.infer<typeof companySchema>;

export function EntreprisesContact() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      company: "",
      ninea: "",
      name: "",
      phone: "",
      email: "",
      employees: "",
    },
  });

  const onSubmit = async (data: CompanyFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Demande compte entreprise",
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: `Entreprise: ${data.company}\nNINEA: ${data.ninea || "-"}\nNombre de collaborateurs: ${data.employees}`,
          source: "entreprise",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error || "Envoi impossible. Réessayez plus tard.");
        setIsSubmitting(false);
        return;
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        reset();
      }, 3000);
    } catch {
      setSubmitError("Erreur réseau. Réessayez plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-hover py-20 lg:py-28">
        <div className="container mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-md"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500">
              <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-6 font-sans text-3xl font-bold text-white">
              Demande reçue !
            </h3>
            <p className="mt-3 font-sans text-lg text-white/80">
              Notre équipe vous contactera sous 24h pour créer votre compte entreprise
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-hover py-20 lg:py-28">
      <div
        className="grain-texture pointer-events-none absolute inset-0"
        style={{ opacity: 0.025 }}
      />

      <div className="container relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="font-sans text-sm font-bold uppercase tracking-widest text-accent">
              Créer votre compte
            </p>
            <h2 className="mt-3 font-sans text-4xl font-bold text-white md:text-5xl">
              Rejoignez +50 entreprises
            </h2>
            <p className="mt-4 font-sans text-lg text-white/80">
              Démarrez en moins de 48h · Sans engagement
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md lg:p-8"
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                        Nom de l&apos;entreprise *
                      </label>
                      <div className="relative">
                        <Building2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                          type="text"
                          {...field}
                          className={cn(
                            "h-[52px] w-full rounded-input border bg-white/10 pl-12 pr-4 font-sans text-base text-white placeholder:text-white/40 backdrop-blur-sm focus:bg-white/15 focus:outline-none focus:ring-4",
                            errors.company
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-white/20 focus:border-accent focus:ring-accent/20"
                          )}
                        />
                      </div>
                      {errors.company && (
                        <p className="mt-1 font-sans text-sm text-red-300">{errors.company.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="ninea"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                        NINEA{" "}
                        <span className="font-400 text-white/50">(optionnel)</span>
                      </label>
                      <div className="relative">
                        <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                          type="text"
                          {...field}
                          placeholder="ex: 123456789"
                          className="h-[52px] w-full rounded-input border border-white/20 bg-white/10 pl-12 pr-4 font-sans text-base text-white placeholder:text-white/40 backdrop-blur-sm focus:border-accent focus:bg-white/15 focus:outline-none focus:ring-4 focus:ring-accent/20"
                        />
                      </div>
                    </div>
                  )}
                />
              </div>

              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                      Nom du contact *
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        {...field}
                        className={cn(
                          "h-[52px] w-full rounded-input border bg-white/10 pl-12 pr-4 font-sans text-base text-white placeholder:text-white/40 backdrop-blur-sm focus:bg-white/15 focus:outline-none focus:ring-4",
                          errors.name
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            : "border-white/20 focus:border-accent focus:ring-accent/20"
                        )}
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 font-sans text-sm text-red-300">{errors.name.message}</p>
                    )}
                  </div>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                        Téléphone *
                      </label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                          type="tel"
                          {...field}
                          placeholder="+221 77 82 23 493"
                          className={cn(
                            "h-[52px] w-full rounded-input border bg-white/10 pl-12 pr-4 font-sans text-base text-white placeholder:text-white/40 backdrop-blur-sm focus:bg-white/15 focus:outline-none focus:ring-4",
                            errors.phone
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-white/20 focus:border-accent focus:ring-accent/20"
                          )}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 font-sans text-sm text-red-300">{errors.phone.message}</p>
                      )}
                    </div>
                  )}
                />

                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                        Email professionnel *
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                          type="email"
                          {...field}
                          className={cn(
                            "h-[52px] w-full rounded-input border bg-white/10 pl-12 pr-4 font-sans text-base text-white placeholder:text-white/40 backdrop-blur-sm focus:bg-white/15 focus:outline-none focus:ring-4",
                            errors.email
                              ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                              : "border-white/20 focus:border-accent focus:ring-accent/20"
                          )}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1 font-sans text-sm text-red-300">{errors.email.message}</p>
                      )}
                    </div>
                  )}
                />
              </div>

              <Controller
                name="employees"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="mb-2 block font-sans text-sm font-semibold text-white/90">
                      Nombre de collaborateurs *
                    </label>
                    <div className="relative">
                      <Users className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                      <select
                        {...field}
                        className={cn(
                          "h-[52px] w-full rounded-input border bg-white/10 pl-12 pr-4 font-sans text-base text-white backdrop-blur-sm focus:bg-white/15 focus:outline-none focus:ring-4",
                          errors.employees
                            ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            : "border-white/20 focus:border-accent focus:ring-accent/20"
                        )}
                      >
                        <option value="" className="text-grey-900">Sélectionnez...</option>
                        <option value="1-10" className="text-grey-900">1 à 10</option>
                        <option value="11-50" className="text-grey-900">11 à 50</option>
                        <option value="51-200" className="text-grey-900">51 à 200</option>
                        <option value="200+" className="text-grey-900">Plus de 200</option>
                      </select>
                    </div>
                    {errors.employees && (
                      <p className="mt-1 font-sans text-sm text-red-300">{errors.employees.message}</p>
                    )}
                  </div>
                )}
              />
            </div>

            {submitError && (
              <p className="rounded-xl bg-red-500/20 px-4 py-3 font-sans text-sm text-red-200">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-8 flex h-[60px] w-full items-center justify-center gap-3 rounded-btn bg-accent font-sans text-lg font-bold text-brand shadow-[0_6px_24px_rgba(255,195,0,0.4)] transition-all hover:bg-accent-light hover:shadow-[0_8px_32px_rgba(255,195,0,0.5)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  Créer mon compte entreprise
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>

            <p className="mt-6 text-center font-sans text-sm text-white/60">
              🔒 Données sécurisées · Réponse sous 24h · Sans engagement
            </p>
          </motion.form>
        </div>
      </div>
    </section>
  );
}
