package org.example.smartparking.entity;

public enum PricingTier {
    /** 5 MAD/h typical street — daily cap 25 MAD */
    STANDARD,
    /** 8–10 MAD/h premium zones (e.g. Jemaa el-Fna) — daily cap 40 MAD */
    PREMIUM,
    /** 3 MAD/h peripheral — daily cap 15 MAD */
    ECONOMY;

    public double defaultDailyCapMAD() {
        return switch (this) {
            case STANDARD -> 25.0;
            case PREMIUM -> 40.0;
            case ECONOMY -> 15.0;
        };
    }
}
