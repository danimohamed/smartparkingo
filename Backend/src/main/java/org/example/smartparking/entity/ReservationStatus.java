package org.example.smartparking.entity;

public enum ReservationStatus {
    ACTIVE,
    COMPLETED,
    CANCELLED,
    /** Did not check in within grace period after start time. */
    NO_SHOW
}

