/**
 * Utility functions for handling Brazilian phone numbers in the Presttech Ops Console.
 */

export interface NormalizedPhone {
  e164?: string;
  whatsappDigits?: string;
  isValid: boolean;
}

/**
 * Normalizes Brazilian phone numbers.
 * 
 * Rules:
 * - Removes non-numeric characters.
 * - Handles duplicate 55 prefix (e.g., 5555...).
 * - Validates length:
 *   - Without 55: 10 (fixed) or 11 (mobile) digits.
 *   - With 55: 12 (fixed) or 13 (mobile) digits.
 */
export function normalizeBRPhoneClient(input: string): NormalizedPhone {
  if (!input) return { isValid: false };

  // Remove all non-numeric characters
  let digits = input.replace(/\D/g, "");

  // Handle duplicate 55 prefix (common when pasting pre-formatted numbers)
  // If it starts with 5555, we assume the first 55 is the country code and the second 55 is also being treated as one.
  // We keep reducing until it doesn't start with 5555 anymore, or we reach a reasonable length.
  while (digits.startsWith("5555") && digits.length > 13) {
    digits = digits.substring(2);
  }

  const length = digits.length;
  let finalDigits = digits;

  // Check if it already has the 55 country code
  if (length === 12 || length === 13) {
    if (!digits.startsWith("55")) {
      return { isValid: false };
    }
  } else if (length === 10 || length === 11) {
    // Add 55 country code
    finalDigits = "55" + digits;
  } else {
    // Invalid length for Brazilian numbers
    return { isValid: false };
  }

  // Final validation of digits (should be 12 or 13 now)
  if (finalDigits.length !== 12 && finalDigits.length !== 13) {
    return { isValid: false };
  }

  return {
    e164: `+${finalDigits}`,
    whatsappDigits: finalDigits,
    isValid: true,
  };
}

/**
 * Copies the phone number to clipboard for pasting into MicroSIP.
 * Returns a Promise with the copied number.
 */
export async function dialNumber(e164: string): Promise<string | null> {
  try {
    // Remove the + and country code for local dialing
    const digits = e164.replace(/^\+55/, '');
    await navigator.clipboard.writeText(digits);
    return digits;
  } catch (error) {
    console.error("Failed to copy number:", error);
    return null;
  }
}

/**
 * Opens WhatsApp Web for the given digits in a new tab.
 */
export function openWhatsApp(whatsappDigits: string): void {
  const url = `https://wa.me/${whatsappDigits}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Copies the provided text to the clipboard.
 * Returns a Promise that resolves to true if successful, false otherwise.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
