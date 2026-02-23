"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { AddressValue } from "./address-input";

// CSS Leaflet (côté client uniquement)
import "leaflet/dist/leaflet.css";
import type L from "leaflet";

const DAKAR_CENTER: [number, number] = [14.6937, -17.4441];

// Tuiles OSM (thème sombre CartoDB)
const OSM_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

interface CommanderMapProps {
  pickup: AddressValue;
  dropoff: AddressValue;
  className?: string;
}

export function CommanderMap({ pickup, dropoff, className }: CommanderMapProps) {
  const mapRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<L.Map | null>(null);
  const pickupMarkerRef = React.useRef<L.Marker | null>(null);
  const dropoffMarkerRef = React.useRef<L.Marker | null>(null);
  const routeLayerRef = React.useRef<L.Polyline | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isRouting, setIsRouting] = React.useState(false);

  // Initialiser la carte Leaflet (côté client uniquement)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const initMap = async () => {
      // Attendre le prochain tick pour que le conteneur soit bien attaché au DOM (hydratation Next.js)
      await new Promise((r) => requestAnimationFrame(r));
      if (cancelled) return;

      const el = mapRef.current;
      if (!el || !el.parentElement) return;

      const L = (await import("leaflet")).default;
      if (cancelled || !mapRef.current?.parentElement) return;

      const map = L.map(mapRef.current, {
        center: DAKAR_CENTER,
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer(OSM_TILES, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      if (cancelled) {
        map.remove();
        return;
      }
      mapInstanceRef.current = map;
      setIsLoaded(true);
    };

    initMap();
    return () => {
      cancelled = true;
      routeLayerRef.current?.remove();
      pickupMarkerRef.current?.remove();
      dropoffMarkerRef.current?.remove();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      pickupMarkerRef.current = null;
      dropoffMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  // Mettre à jour marqueurs et itinéraire
  React.useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return;

    const hasPickup =
      pickup.latitude != null && pickup.longitude != null;
    const hasDropoff =
      dropoff.latitude != null && dropoff.longitude != null;

    const updateMarkersAndRoute = async () => {
      if (!mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Marqueur départ
      if (hasPickup) {
        const pos: L.LatLngExpression = [pickup.latitude!, pickup.longitude!];
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#FFC300;border:3px solid #E6B000;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        if (pickupMarkerRef.current) {
          pickupMarkerRef.current.setLatLng(pos);
        } else {
          pickupMarkerRef.current = L.marker(pos, { icon }).addTo(map);
        }
      } else {
        pickupMarkerRef.current?.remove();
        pickupMarkerRef.current = null;
      }

      // Marqueur arrivée
      if (hasDropoff) {
        const pos: L.LatLngExpression = [dropoff.latitude!, dropoff.longitude!];
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#110E40;border:3px solid #1C1870;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        if (dropoffMarkerRef.current) {
          dropoffMarkerRef.current.setLatLng(pos);
        } else {
          dropoffMarkerRef.current = L.marker(pos, { icon }).addTo(map);
        }
      } else {
        dropoffMarkerRef.current?.remove();
        dropoffMarkerRef.current = null;
      }

      // Itinéraire OSRM
      routeLayerRef.current?.remove();
      routeLayerRef.current = null;

      if (hasPickup && hasDropoff) {
        setIsRouting(true);
        const coords = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
        try {
          const res = await fetch(url);
          const data = await res.json();
          if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length) {
            const coordsGeo = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]);
            routeLayerRef.current = L.polyline(coordsGeo, {
              color: "#FFC300",
              weight: 4,
              opacity: 0.9,
            }).addTo(map);
          }
        } finally {
          setIsRouting(false);
        }

        const bounds = L.latLngBounds(
          [pickup.latitude!, pickup.longitude!],
          [dropoff.latitude!, dropoff.longitude!]
        );
        map.fitBounds(bounds, { padding: [60, 40] });
      } else if (hasPickup) {
        map.setView([pickup.latitude!, pickup.longitude!], 15);
      } else if (hasDropoff) {
        map.setView([dropoff.latitude!, dropoff.longitude!], 15);
      } else {
        map.setView(DAKAR_CENTER, 13);
      }
    };

    updateMarkersAndRoute();
  }, [isLoaded, pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude]);

  // Style global pour masquer la bordure des marqueurs Leaflet
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = ".custom-marker { background: transparent !important; border: none !important; }";
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  return (
    <div
      className={cn(
        "relative z-0 isolate h-full w-full overflow-hidden",
        className
      )}
    >
      <div ref={mapRef} className="h-full w-full bg-[#0d1117]" />

      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d1117]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="font-sans text-sm text-grey-500">Chargement de la carte…</p>
        </div>
      )}

      {isRouting && (
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
          <span className="font-sans text-xs text-white">Calcul du trajet…</span>
        </div>
      )}

      {(pickup.latitude != null || dropoff.latitude != null) && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2 rounded-xl border border-white/10 bg-[#0d1117]/90 p-3 backdrop-blur-sm">
          {pickup.latitude != null && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-accent" />
              <span className="font-sans text-xs text-white/70">Départ</span>
            </div>
          )}
          {dropoff.latitude != null && (
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full border border-brand-hover bg-brand" />
              <span className="font-sans text-xs text-white/70">Arrivée</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
