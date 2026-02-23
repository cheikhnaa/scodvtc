/**
 * Client Nominatim (OpenStreetMap) pour recherche d'adresses et géocodage inverse.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * 1 requête/seconde max, User-Agent requis.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = "SCOD-VTC/1.0 (https://github.com/scod-vtc)";

async function fetchNominatim<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "Accept-Language": "fr", "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Nominatim: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface NominatimSearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Recherche d'adresses (autocomplete).
 * Limiter à 1 appel / seconde côté client (debounce déjà dans AddressInput).
 */
export async function nominatimSearch(
  query: string,
  options?: { countryCodes?: string; limit?: number }
): Promise<NominatimSearchResult[]> {
  if (!query || query.trim().length < 3) return [];
  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    addressdetails: "1",
    limit: String(options?.limit ?? 5),
  });
  if (options?.countryCodes) params.set("countrycodes", options.countryCodes);
  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  return fetchNominatim<NominatimSearchResult[]>(url);
}

export interface NominatimReverseResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Géocodage inverse : coordonnées → adresse.
 */
export async function nominatimReverse(
  lat: number,
  lon: number
): Promise<NominatimReverseResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
  });
  const url = `${NOMINATIM_BASE}/reverse?${params.toString()}`;
  const data = await fetchNominatim<NominatimReverseResult>(url);
  return data ?? null;
}
