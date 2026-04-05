// Phone number normalization
// Strips everything except digits — stores as pure digits (no +, spaces, dashes)
// WASenderApi sends cleanedSenderPn as digits only, so we match that format

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}
