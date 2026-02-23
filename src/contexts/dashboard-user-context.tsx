"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────── */

export interface DashboardUserInfo {
  /** Nom complet (user_metadata.full_name ou email) */
  displayName: string;
  /** Initiales pour l'avatar (2 caractères) */
  initials: string;
  email: string;
  phone: string;
  /** Date de création du compte pour "Membre depuis..." */
  createdAt: string | null;
}

interface DashboardUserContextValue {
  user: User | null;
  info: DashboardUserInfo | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const defaultInfo: DashboardUserInfo = {
  displayName: "Utilisateur",
  initials: "U",
  email: "",
  phone: "",
  createdAt: null,
};

function getInfoFromUser(user: User): DashboardUserInfo {
  const meta = user.user_metadata ?? {};
  const fullName = (meta.full_name as string) || (meta.name as string) || "";
  const email = user.email ?? "";
  const phone = (meta.phone as string) || "";

  let displayName = fullName.trim() || email;
  if (!displayName) displayName = "Utilisateur";

  let initials = "U";
  if (fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
    } else {
      initials = fullName.slice(0, 2).toUpperCase();
    }
  } else if (email) {
    initials = email.slice(0, 2).toUpperCase();
  }

  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;

  return {
    displayName,
    initials,
    email,
    phone,
    createdAt,
  };
}

const DashboardUserContext = createContext<DashboardUserContextValue | null>(null);

export function useDashboardUser(): DashboardUserContextValue {
  const ctx = useContext(DashboardUserContext);
  if (!ctx) {
    throw new Error("useDashboardUser must be used within DashboardUserProvider");
  }
  return ctx;
}

interface DashboardUserProviderProps {
  children: ReactNode;
  /** Si true, redirige vers /connexion quand pas de session */
  requireAuth?: boolean;
}

export function DashboardUserProvider({ children, requireAuth = true }: DashboardUserProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const supabase = createClient();
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [refreshUser]);

  useEffect(() => {
    if (!requireAuth || loading) return;
    if (!user) {
      router.replace("/connexion?redirect=/mon-compte");
    }
  }, [user, loading, requireAuth, router]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.replace("/connexion");
  }, [router]);

  const info: DashboardUserInfo | null = user ? getInfoFromUser(user) : null;

  const value: DashboardUserContextValue = {
    user,
    info,
    loading,
    signOut,
  };

  return (
    <DashboardUserContext.Provider value={value}>
      {children}
    </DashboardUserContext.Provider>
  );
}
