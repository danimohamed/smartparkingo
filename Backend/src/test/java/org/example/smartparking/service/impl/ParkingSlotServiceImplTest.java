package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.ParkingSlotRequest;
import org.example.smartparking.dto.response.ParkingSlotResponse;
import org.example.smartparking.entity.*;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParkingSlotServiceImplTest {

    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private ParkingRepository parkingRepository;

    @InjectMocks
    private ParkingSlotServiceImpl parkingSlotService;

    private Parking testParking;
    private ParkingSlot testSlot;
    private ParkingSlotRequest slotRequest;

    @BeforeEach
    void setUp() {
        testParking = Parking.builder()
                .id(1L)
                .name("Parking Gueliz")
                .address("Gueliz, Marrakech")
                .totalSlots(50)
                .pricePerHour(10.0)
                .active(true)
                .build();

        testSlot = ParkingSlot.builder()
                .id(1L)
                .slotNumber("A-01")
                .status(SlotStatus.AVAILABLE)
                .slotType(SlotType.STANDARD)
                .floor("RDC")
                .parking(testParking)
                .createdAt(LocalDateTime.now())
                .build();

        slotRequest = new ParkingSlotRequest();
        slotRequest.setSlotNumber("B-05");
        slotRequest.setSlotType(SlotType.VIP);
        slotRequest.setFloor("1");
        slotRequest.setParkingId(1L);
    }

    @Nested
    @DisplayName("createParkingSlot()")
    class CreateParkingSlotTests {

        @Test
        @DisplayName("Should create a new parking slot")
        void shouldCreateSlot() {
            ParkingSlot savedSlot = ParkingSlot.builder()
                    .id(2L)
                    .slotNumber("B-05")
                    .status(SlotStatus.AVAILABLE)
                    .slotType(SlotType.VIP)
                    .floor("1")
                    .parking(testParking)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(parkingRepository.findById(1L)).thenReturn(Optional.of(testParking));
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(savedSlot);

            ParkingSlotResponse result = parkingSlotService.createParkingSlot(slotRequest);

            assertThat(result).isNotNull();
            assertThat(result.getSlotNumber()).isEqualTo("B-05");
            assertThat(result.getSlotType()).isEqualTo("VIP");
            assertThat(result.getFloor()).isEqualTo("1");
            assertThat(result.getStatus()).isEqualTo("AVAILABLE");
            assertThat(result.getParkingName()).isEqualTo("Parking Gueliz");
        }

        @Test
        @DisplayName("Should default to STANDARD slot type when not specified")
        void shouldDefaultToStandard() {
            slotRequest.setSlotType(null);

            ParkingSlot savedSlot = ParkingSlot.builder()
                    .id(2L)
                    .slotNumber("B-05")
                    .status(SlotStatus.AVAILABLE)
                    .slotType(SlotType.STANDARD)
                    .floor("1")
                    .parking(testParking)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(parkingRepository.findById(1L)).thenReturn(Optional.of(testParking));
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(savedSlot);

            ParkingSlotResponse result = parkingSlotService.createParkingSlot(slotRequest);

            assertThat(result.getSlotType()).isEqualTo("STANDARD");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when parking not found")
        void shouldThrowWhenParkingNotFound() {
            slotRequest.setParkingId(999L);
            when(parkingRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingSlotService.createParkingSlot(slotRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Parking not found with id: 999");
        }
    }

    @Nested
    @DisplayName("updateParkingSlot()")
    class UpdateParkingSlotTests {

        @Test
        @DisplayName("Should update existing parking slot")
        void shouldUpdateSlot() {
            ParkingSlotRequest updateRequest = new ParkingSlotRequest();
            updateRequest.setSlotNumber("A-01-Updated");
            updateRequest.setSlotType(SlotType.ELECTRIC);
            updateRequest.setFloor("2");
            updateRequest.setStatus(SlotStatus.MAINTENANCE);
            updateRequest.setParkingId(1L);

            ParkingSlot updatedSlot = ParkingSlot.builder()
                    .id(1L)
                    .slotNumber("A-01-Updated")
                    .status(SlotStatus.MAINTENANCE)
                    .slotType(SlotType.ELECTRIC)
                    .floor("2")
                    .parking(testParking)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(parkingSlotRepository.findById(1L)).thenReturn(Optional.of(testSlot));
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(updatedSlot);

            ParkingSlotResponse result = parkingSlotService.updateParkingSlot(1L, updateRequest);

            assertThat(result.getSlotNumber()).isEqualTo("A-01-Updated");
            assertThat(result.getSlotType()).isEqualTo("ELECTRIC");
            assertThat(result.getStatus()).isEqualTo("MAINTENANCE");
            assertThat(result.getFloor()).isEqualTo("2");
        }

        @Test
        @DisplayName("Should keep existing slot type when not specified in update")
        void shouldKeepExistingSlotType() {
            ParkingSlotRequest updateRequest = new ParkingSlotRequest();
            updateRequest.setSlotNumber("A-01");
            updateRequest.setSlotType(null); // not specified
            updateRequest.setFloor("RDC");
            updateRequest.setParkingId(1L);

            when(parkingSlotRepository.findById(1L)).thenReturn(Optional.of(testSlot));
            when(parkingSlotRepository.save(any(ParkingSlot.class))).thenReturn(testSlot);

            ParkingSlotResponse result = parkingSlotService.updateParkingSlot(1L, updateRequest);

            assertThat(result.getSlotType()).isEqualTo("STANDARD");
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when slot not found")
        void shouldThrowWhenSlotNotFound() {
            when(parkingSlotRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingSlotService.updateParkingSlot(999L, slotRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Parking slot not found with id: 999");
        }
    }

    @Nested
    @DisplayName("deleteParkingSlot()")
    class DeleteParkingSlotTests {

        @Test
        @DisplayName("Should delete existing slot")
        void shouldDeleteSlot() {
            when(parkingSlotRepository.findById(1L)).thenReturn(Optional.of(testSlot));

            parkingSlotService.deleteParkingSlot(1L);

            verify(parkingSlotRepository).delete(testSlot);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existing slot")
        void shouldThrowWhenNotFound() {
            when(parkingSlotRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingSlotService.deleteParkingSlot(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getParkingSlotById()")
    class GetParkingSlotByIdTests {

        @Test
        @DisplayName("Should return slot by ID")
        void shouldReturnSlotById() {
            when(parkingSlotRepository.findById(1L)).thenReturn(Optional.of(testSlot));

            ParkingSlotResponse result = parkingSlotService.getParkingSlotById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getSlotNumber()).isEqualTo("A-01");
            assertThat(result.getParkingId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when not found")
        void shouldThrowWhenNotFound() {
            when(parkingSlotRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingSlotService.getParkingSlotById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getSlotsByParkingId()")
    class GetSlotsByParkingIdTests {

        @Test
        @DisplayName("Should return all slots for a parking")
        void shouldReturnSlots() {
            when(parkingSlotRepository.findByParkingId(1L)).thenReturn(List.of(testSlot));

            List<ParkingSlotResponse> result = parkingSlotService.getSlotsByParkingId(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getParkingId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should return empty list when no slots")
        void shouldReturnEmpty() {
            when(parkingSlotRepository.findByParkingId(999L)).thenReturn(Collections.emptyList());

            List<ParkingSlotResponse> result = parkingSlotService.getSlotsByParkingId(999L);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getAvailableSlots()")
    class GetAvailableSlotsTests {

        @Test
        @DisplayName("Should return only available slots for parking")
        void shouldReturnAvailableSlots() {
            when(parkingSlotRepository.findByParkingIdAndStatus(1L, SlotStatus.AVAILABLE))
                    .thenReturn(List.of(testSlot));

            List<ParkingSlotResponse> result = parkingSlotService.getAvailableSlots(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("AVAILABLE");
        }

        @Test
        @DisplayName("Should return empty list when no available slots")
        void shouldReturnEmptyWhenNoneAvailable() {
            when(parkingSlotRepository.findByParkingIdAndStatus(1L, SlotStatus.AVAILABLE))
                    .thenReturn(Collections.emptyList());

            List<ParkingSlotResponse> result = parkingSlotService.getAvailableSlots(1L);

            assertThat(result).isEmpty();
        }
    }
}

