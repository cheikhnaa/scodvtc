"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Shield,
  Plane,
  MessageSquare,
} from "lucide-react";

export function AirportHero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-brand-dark">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/cars/header-hero/transfert-aeroport.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/85 to-brand-dark/40" />
        
        {/* Grain texture */}
        <div
          className="grain-texture pointer-events-none absolute inset-0"
          style={{ opacity: 0.025 }}
        />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-6 pt-28 pb-20 lg:px-8 lg:pt-36 lg:pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <span className="text-label relative inline-flex items-center gap-2 rounded-pill border border-accent/30 bg-accent/10 px-4 py-2 text-accent backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Service le + populaire
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-hero-inverse"
          >
            Transfert Aéroport{" "}
            <span className="text-accent">AIBD</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-body-lg-inverse mt-5 max-w-xl"
          >
            Dakar ↔ Aéroport Blaise Diagne — Tarif fixe, chauffeur avec
            pancarte nominative
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            {[
              { icon: Shield, label: "Tarif fixe garanti" },
              { icon: Clock, label: "15 min d'attente offertes" },
              { icon: Plane, label: "Suivi de vol temps réel" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-accent" />
                <span className="text-sm-inverse" style={{ fontWeight: "var(--weight-semibold)", color: "var(--color-text-inverse)" }}>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Link
              href="/reservation"
              className="group flex items-center gap-2 rounded-btn bg-accent px-8 py-4 text-cta text-brand uppercase shadow-[0_4px_20px_rgba(255,195,0,0.4)] transition-all hover:bg-accent-light hover:shadow-[0_6px_28px_rgba(255,195,0,0.5)] hover:translate-y-[-2px]"
            >
              Réserver maintenant
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <a
              href="https://wa.me/221778223493"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-btn border-2 border-white/20 bg-white/5 px-8 py-4 text-cta text-white uppercase backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10"
            >
              <MessageSquare className="h-5 w-5" />
              WhatsApp
            </a>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
