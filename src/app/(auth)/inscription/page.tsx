"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const signUpSchema = z
  .object({
    name: z.string().min(2, "Nom requis"),
    phone: z.string().min(8, "Numéro invalide").regex(/^\d+$/, "Chiffres uniquement"),
    email: z.string().email("Email invalide"),
    password: z.string().min(6, "Minimum 6 caractères"),
    confirmPassword: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "Veuillez accepter les CGV" }) }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type SignUpData = z.infer<typeof signUpSchema>;

const inputCls = (err?: boolean) =>
  cn(
    "h-12 w-full rounded-xl border-2 bg-white px-4 text-[15px] text-grey-900",
    "placeholder:text-grey-400 outline-none transition-all duration-200",
    "focus:border-accent focus:shadow-lg focus:shadow-accent/10",
    err ? "border-red-400" : "border-grey-200"
  );

function AuthPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-1/2">
      <Image
        src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80"
        alt="Véhicule premium SCOD VTC"
        fill
        priority
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,9,32,0.92) 0%, rgba(10,9,32,0.70) 50%, rgba(10,9,32,0.45) 100%)",
        }}
      />
      <div className="relative flex flex-col justify-end p-12">
        <div className="mb-8 space-y-3">
          {[
            "Réservation en 30 secondes",
            "Tarif fixe garanti en FCFA",
            "Chauffeur confirmé immédiatement",
            "Suivi en temps réel",
          ].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent">
                <CheckCircle2 className="h-3 w-3 text-brand" />
              </span>
              <span className="text-[14px] font-medium text-white/80">{f}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-6">
          <p className="text-[13px] text-white/60">
            <span className="font-semibold text-white">2 000+ clients</span> nous font déjà confiance
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  const [done, setDone] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignUpData>({ resolver: zodResolver(signUpSchema) });

  const onSubmit = async (data: SignUpData) => {
    setSignUpError(null);
    if (!isSupabaseConfigured()) {
      setSignUpError(
        "Supabase n'est pas configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local (voir Paramètres API du projet Supabase)."
      );
      return;
    }
    const supabase = createClient();
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
          phone: `+221${data.phone}`,
        },
      },
    });

    const emailAlreadyUsedMessage =
      "Un compte existe déjà avec cette adresse email. Une personne qui a déjà un compte ne peut pas en créer un second. Connectez-vous ou utilisez une autre adresse email.";

    if (error) {
      const msg = (error.message || "").toLowerCase();
      const isEmailTaken =
        error.code === "user_already_exists" ||
        msg.includes("already registered") ||
        msg.includes("already exists") ||
        msg.includes("déjà utilisé") ||
        msg.includes("already in use") ||
        msg.includes("user already") ||
        msg.includes("email already") ||
        msg.includes("duplicate");
      setSignUpError(isEmailTaken ? emailAlreadyUsedMessage : error.message || "Erreur lors de la création du compte.");
      return;
    }

    // Supabase peut renvoyer un succès sans erreur alors que l'email existe déjà :
    // user.identities est alors un tableau vide (aucune nouvelle identité créée).
    if (signUpData.user?.identities?.length === 0) {
      setSignUpError(emailAlreadyUsedMessage);
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="flex min-h-screen">
        <div className="flex w-full flex-col items-center justify-center px-5 lg:w-1/2 lg:px-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-5 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="font-sans text-[28px] font-bold text-brand">Compte créé !</h1>
            <p className="max-w-sm text-[14px] leading-relaxed text-grey-500">
              Bienvenue chez SCOD VTC. Votre compte est prêt. Connectez-vous pour accéder à votre espace et réserver.
            </p>
            <Link
              href="/connexion"
              className="mt-2 flex h-12 items-center gap-2 rounded-xl bg-accent px-8 font-bold text-[15px] text-brand shadow-lg shadow-accent/25 transition-colors hover:bg-accent-light"
            >
              Se connecter
            </Link>
          </motion.div>
        </div>
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col px-5 py-10 sm:px-10 lg:w-1/2 lg:px-16">
        <Link href="/" className="mb-10 block">
          <span className="font-sans text-[22px] font-bold tracking-tight text-brand">
            SCOD <span className="text-accent">VTC</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[420px]">
            <h1 className="mb-1 font-sans text-[30px] font-bold text-brand">Créez votre compte</h1>
            <p className="mb-2 text-[14px] text-grey-500">Réservez votre premier trajet en 30 secondes</p>
            <p className="mb-8 text-[13px] text-grey-400">
              Une adresse email ne peut être utilisée que pour un seul compte. Déjà un compte ?{" "}
              <Link href="/connexion" className="font-semibold text-accent hover:underline">
                Connectez-vous
              </Link>
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Nom complet *</label>
                <input
                  {...form.register("name")}
                  type="text"
                  placeholder="Moussa Sarr"
                  className={inputCls(!!form.formState.errors.name)}
                />
                {form.formState.errors.name && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Téléphone *</label>
                <div className="flex gap-2">
                  <div className="flex h-12 shrink-0 items-center gap-2 rounded-xl border-2 border-grey-200 bg-grey-50 px-3">
                    <span className="text-[18px] leading-none">🇸🇳</span>
                    <span className="text-[14px] font-semibold text-grey-700">+221</span>
                  </div>
                  <input
                    {...form.register("phone")}
                    type="tel"
                    placeholder="77 000 00 00"
                    className={inputCls(!!form.formState.errors.phone)}
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Email *</label>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="vous@email.com"
                  className={inputCls(!!form.formState.errors.email)}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.email.message}</p>
                )}
                <p className="mt-1 text-[11px] text-grey-400">Une seule adresse email par compte</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Mot de passe *</label>
                <div className="relative">
                  <input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputCls(!!form.formState.errors.password)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-400 hover:text-grey-600"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.password.message}</p>
                )}
                <p className="mt-1 text-[11px] text-grey-400">Minimum 6 caractères</p>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Confirmer le mot de passe *</label>
                <input
                  {...form.register("confirmPassword")}
                  type="password"
                  placeholder="••••••••"
                  className={inputCls(!!form.formState.errors.confirmPassword)}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {signUpError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{signUpError}</p>
              )}

              <div>
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    {...form.register("terms")}
                    type="checkbox"
                    className="peer mt-0.5 h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-grey-300 bg-white transition-colors checked:border-accent checked:bg-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <span className="text-[13px] leading-relaxed text-grey-600">
                    J&apos;accepte les{" "}
                    <Link href="/legal/cgv" className="font-semibold text-accent underline underline-offset-4" target="_blank">
                      CGV
                    </Link>{" "}
                    et la{" "}
                    <Link href="/legal/confidentialite" className="font-semibold text-accent underline underline-offset-4" target="_blank">
                      Politique de confidentialité
                    </Link>
                  </span>
                </label>
                {form.formState.errors.terms && (
                  <p className="mt-2 text-[12px] text-red-500">{form.formState.errors.terms.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={form.formState.isSubmitting}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-xl",
                  "bg-accent font-bold text-[15px] text-brand",
                  "shadow-lg shadow-accent/25 transition-all duration-200 hover:bg-accent-light",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              >
                {form.formState.isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                ) : (
                  "Créer mon compte"
                )}
              </motion.button>
            </form>

            <p className="mt-10 text-center text-[13px] text-grey-500">
              Déjà un compte ?{" "}
              <Link href="/connexion" className="font-semibold text-accent hover:underline underline-offset-4">
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthPanel />
    </div>
  );
}
