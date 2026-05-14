package org.example.smartparking.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Locks in the contract that reservation-side and guard-side normalization
 * agree, including for Arabic plates. A regression here re-introduces the bug
 * where an app booking made with an Arabic plate could never be matched by the
 * guard scan because the two sides produced different normalized keys.
 */
class PlateNormalizerTest {

    @Test
    void stripsSeparatorsAndUppercases() {
        assertEquals("12345AB", PlateNormalizer.normalize(" 12345-ab "));
        assertEquals("12345AB", PlateNormalizer.normalize("12345 | ab"));
    }

    @Test
    void mapsArabicLettersToStableAsciiCodes() {
        // Same plate written in Arabic and its app-side Latin equivalent must
        // collapse to the same key when the user later types it manually.
        String arabic = PlateNormalizer.normalize("12345 ب 6");
        String latin  = PlateNormalizer.normalize("12345 B 6");
        assertEquals(latin, arabic);
        assertEquals("12345B6", arabic);
    }

    @Test
    void emptyOrJunkReturnsEmptyString() {
        assertEquals("", PlateNormalizer.normalize(""));
        assertEquals("", PlateNormalizer.normalize("---"));
        assertEquals("", PlateNormalizer.normalize(null));
    }

    @Test
    void isValidEnforcesMinLength() {
        assertFalse(PlateNormalizer.isValid("ABC"));
        assertTrue(PlateNormalizer.isValid("12345B6"));
        assertFalse(PlateNormalizer.isValid(""));
        assertFalse(PlateNormalizer.isValid(null));
    }
}

