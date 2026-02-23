/**
 * Format utilities for SCOD VTC
 */

/**
 * Format price in FCFA
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

/**
 * Format phone number for display : XX XXX XX XX (ex. 78 343 82 49)
 * Accepts full number with +221 or 9 digits only.
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const digits = cleaned.startsWith("221") ? cleaned.slice(3) : cleaned;
  if (digits.length >= 9) {
    const d = digits.slice(0, 9);
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }
  return phone;
}

/** Format with country prefix for display: +221 XX XXX XX XX */
export function formatPhoneWithCountry(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const digits = cleaned.startsWith("221") ? cleaned.slice(3) : cleaned;
  if (digits.length >= 9) {
    const d = digits.slice(0, 9);
    return `+221 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
  }
  return phone;
}

/**
 * Format date to French locale
 */
export function formatDate(date: Date | string, format: "short" | "long" = "short"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (format === "long") {
    return new Intl.DateTimeFormat("fr-SN", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  }
  
  return new Intl.DateTimeFormat("fr-SN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

/**
 * Format duration in minutes
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
}

/**
 * Format distance in kilometers
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  
  return `${km.toFixed(1)} km`;
}

/**
 * Format booking reference
 */
export function formatBookingReference(reference: string): string {
  return reference.toUpperCase();
}

/**
 * Get initials from name
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
