"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "6 caractères minimum"),
});

type LoginData = z.infer<typeof loginSchema>;

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
        <blockquote className="mb-6">
          <p className="font-sans text-[22px] font-bold leading-snug text-white">
            "Chauffeur professionnel,{" "}
            <span className="text-accent">tarif fixe garanti.</span>
            <br />
            Partout au Sénégal."
          </p>
        </blockquote>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent font-sans font-bold text-brand">
            M
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">Moussa Diallo</p>
            <p className="text-[12px] text-white/50">Client fidèle · Dakar</p>
          </div>
          <div className="ml-auto flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-accent">★</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnexionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<LoginData>({ resolver: zodResolver(loginSchema) });

  const redirectAfterLogin = searchParams.get("redirect");
  const safeRedirect =
    redirectAfterLogin && redirectAfterLogin.startsWith("/") && !redirectAfterLogin.startsWith("//")
      ? redirectAfterLogin
      : "/mon-compte";

  const onSubmit = async (data: LoginData) => {
    setLoginError(null);
    if (!isSupabaseConfigured()) {
      setLoginError(
        "Supabase n'est pas configuré. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local."
      );
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) {
      setLoginError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : error.message);
      return;
    }
    router.push(safeRedirect);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col px-5 py-10 sm:px-10 lg:w-1/2 lg:px-16">
        <Link href="/" className="mb-10 block">
          <span className="font-sans text-[22px] font-bold tracking-tight text-brand">
            SCOD <span className="text-accent">VTC</span>
          </span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-[400px]">
            <h1 className="mb-1 font-sans text-[32px] font-bold text-brand">Bon retour</h1>
            <p className="mb-8 text-[15px] text-grey-500">Connectez-vous pour gérer vos réservations</p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-grey-700">Email</label>
                <input
                  {...form.register("email")}
                  type="email"
                  placeholder="vous@email.com"
                  className={inputCls(!!form.formState.errors.email)}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] font-semibold text-grey-700">Mot de passe</label>
                  <Link href="/connexion/mot-de-passe-oublie" className="text-[12px] font-medium text-accent hover:underline underline-offset-4">
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    {...form.register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(inputCls(!!form.formState.errors.password), "pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-grey-400 transition-colors hover:text-grey-700"
                    aria-label={showPass ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPass ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
                {form.formState.errors.password && (
                  <p className="mt-1 text-[12px] text-red-500">{form.formState.errors.password.message}</p>
                )}
              </div>

              {loginError && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{loginError}</p>
              )}

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
                  "Se connecter"
                )}
              </motion.button>
            </form>

            <p className="mt-10 text-center text-[13px] text-grey-500">
              Pas encore de compte ?{" "}
              <Link href="/inscription" className="font-semibold text-accent hover:underline underline-offset-4">
                Créez-en un
              </Link>
            </p>
          </div>
        </div>
      </div>
      <AuthPanel />
    </div>
  );
}
