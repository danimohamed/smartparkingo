package org.example.smartparking.util;

import java.util.Locale;

/**
 * Normalizes plates for matching (Morocco-style: letters+digits, ignore spaces/dashes).
 */
public final class PlateNormalizer {

    private PlateNormalizer() {
    }

    public static String normalize(String raw) {
        if (raw == null) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        for (char c : raw.toCharArray()) {
            // Map common Moroccan Arabic letters to stable ASCII codes (Buckwalter-ish)
            // so OCR Arabic output can be matched consistently.
            String mapped = mapArabicLetter(c);
            if (mapped != null) {
                sb.append(mapped);
                continue;
            }

            char up = Character.toUpperCase(c);
            if (Character.isLetterOrDigit(up)) {
                sb.append(up);
            }
        }
        return sb.toString();
    }

    public static boolean isValid(String normalized) {
        return normalized != null && normalized.length() >= 4 && normalized.length() <= 64;
    }

    /**
     * Returns an ASCII code for an Arabic letter, or null if not Arabic.
     * We only need deterministic matching, not perfect transliteration.
     */
    private static String mapArabicLetter(char c) {
        return switch (c) {
            case 'أ', 'ا', 'إ', 'آ' -> "A";
            case 'ب' -> "B";
            case 'ت' -> "T";
            case 'ث' -> "V";
            case 'ج' -> "J";
            case 'ح' -> "H";
            case 'خ' -> "X";
            case 'د' -> "D";
            case 'ذ' -> "Z";
            case 'ر' -> "R";
            case 'ز' -> "Z";
            case 'س' -> "S";
            case 'ش' -> "$";
            case 'ص' -> "S";
            case 'ض' -> "D";
            case 'ط' -> "T";
            case 'ظ' -> "Z";
            case 'ع' -> "E";
            case 'غ' -> "G";
            case 'ف' -> "F";
            case 'ق' -> "Q";
            case 'ك' -> "K";
            case 'ل' -> "L";
            case 'م' -> "M";
            case 'ن' -> "N";
            case 'ه' -> "H";
            case 'و' -> "W";
            case 'ي' -> "Y";
            default -> null;
        };
    }
}
