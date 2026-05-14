package org.example.smartparking.util;

import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.ParkingSlot;
import org.example.smartparking.entity.SlotStatus;
import org.example.smartparking.entity.SlotType;
import org.example.smartparking.exception.BadRequestException;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds slot rows compatible with the 3D digital twin (slot prefixes A–E, up to 10 per row).
 */
public final class OwnerParkingLayout {

    private static final int MAX_FLOORS = 10;
    private static final int MAX_SPOTS_PER_FLOOR = 50;
    private static final int MAX_ROWS_PER_FLOOR = 5;
    private static final int SLOTS_PER_ROW = 10;

    private static final String[] ABOVE_GROUND_FLOOR_LABELS =
            {"RDC", "1", "2", "3", "4", "5", "6", "7", "8", "9"};
    private static final char[] ROW_LETTERS = {'A', 'B', 'C', 'D', 'E'};

    private OwnerParkingLayout() {
    }

    public static List<ParkingSlot> generateSlots(Parking parking, int floors, int spotsPerFloor, boolean underground) {
        if (floors < 1 || floors > MAX_FLOORS) {
            throw new BadRequestException("Floors must be between 1 and " + MAX_FLOORS);
        }
        if (spotsPerFloor < 1 || spotsPerFloor > MAX_SPOTS_PER_FLOOR) {
            throw new BadRequestException("Spots per floor must be between 1 and " + MAX_SPOTS_PER_FLOOR);
        }
        int rowsNeeded = (spotsPerFloor + SLOTS_PER_ROW - 1) / SLOTS_PER_ROW;
        if (rowsNeeded > MAX_ROWS_PER_FLOOR) {
            throw new BadRequestException("Spots per floor must fit in at most "
                    + MAX_ROWS_PER_FLOOR + " rows (max " + (MAX_ROWS_PER_FLOOR * SLOTS_PER_ROW) + " spots) for 3D layout");
        }

        String[] floorLabels = buildFloorLabels(floors, underground);
        List<ParkingSlot> slots = new ArrayList<>(floors * spotsPerFloor);

        for (int f = 0; f < floors; f++) {
            String floorName = floorLabels[f];
            int remaining = spotsPerFloor;
            int rowIdx = 0;
            while (remaining > 0) {
                int inRow = Math.min(SLOTS_PER_ROW, remaining);
                char letter = ROW_LETTERS[rowIdx];
                for (int s = 1; s <= inRow; s++) {
                    slots.add(ParkingSlot.builder()
                            .parking(parking)
                            .floor(floorName)
                            .slotNumber(String.format("%s-%02d", letter, s))
                            .status(SlotStatus.AVAILABLE)
                            .slotType(SlotType.STANDARD)
                            .build());
                }
                remaining -= inRow;
                rowIdx++;
            }
        }
        return slots;
    }

    public static int computeTotalSlots(int floors, int spotsPerFloor) {
        return floors * spotsPerFloor;
    }

    private static String[] buildFloorLabels(int floors, boolean underground) {
        String[] out = new String[floors];
        if (underground) {
            for (int i = 0; i < floors; i++) {
                out[i] = "-" + (i + 1);
            }
        } else {
            for (int i = 0; i < floors; i++) {
                out[i] = i < ABOVE_GROUND_FLOOR_LABELS.length
                        ? ABOVE_GROUND_FLOOR_LABELS[i]
                        : String.valueOf(i);
            }
        }
        return out;
    }
}
