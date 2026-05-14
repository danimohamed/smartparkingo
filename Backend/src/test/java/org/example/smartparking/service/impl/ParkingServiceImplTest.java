package org.example.smartparking.service.impl;

import org.example.smartparking.dto.request.ParkingRequest;
import org.example.smartparking.dto.response.ParkingResponse;
import org.example.smartparking.entity.Parking;
import org.example.smartparking.entity.SlotStatus;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingReviewRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.dto.response.ParkingResponse.ParkingResponseBuilder;
import org.example.smartparking.service.ParkingGuardResponseHelper;
import org.example.smartparking.service.ParkingNameValidator;
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
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParkingServiceImplTest {

    @Mock private ParkingRepository parkingRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private UserRepository userRepository;
    @Mock private ParkingNameValidator parkingNameValidator;
    @Mock private ParkingGuardResponseHelper parkingGuardResponseHelper;
    @Mock private ParkingReviewRepository parkingReviewRepository;

    @InjectMocks
    private ParkingServiceImpl parkingService;

    private ParkingRequest parkingRequest;
    private Parking testParking;

    @BeforeEach
    void setUp() {
        parkingRequest = new ParkingRequest();
        parkingRequest.setName("Parking Medina");
        parkingRequest.setAddress("Medina, Marrakech");
        parkingRequest.setDescription("Near Jemaa el-Fnaa");
        parkingRequest.setTotalSlots(50);
        parkingRequest.setPricePerHour(8.0);
        parkingRequest.setLatitude(31.6258);
        parkingRequest.setLongitude(-7.9891);

        testParking = Parking.builder()
                .id(1L)
                .name("Parking Medina")
                .address("Medina, Marrakech")
                .description("Near Jemaa el-Fnaa")
                .totalSlots(50)
                .pricePerHour(8.0)
                .active(true)
                .latitude(31.6258)
                .longitude(-7.9891)
                .createdAt(LocalDateTime.now())
                .build();

        lenient().doAnswer(invocation -> {
            ParkingResponseBuilder b = invocation.getArgument(0);
            b.guardians(Collections.emptyList()).guardId(null).guardName(null).guardPhone(null);
            return null;
        }).when(parkingGuardResponseHelper).applyGuardFields(any(), anyLong());

        lenient().when(parkingReviewRepository.getAvgRating(anyLong())).thenReturn(0.0);
        lenient().when(parkingReviewRepository.countByParkingId(anyLong())).thenReturn(0L);
    }

    @Nested
    @DisplayName("createParking()")
    class CreateParkingTests {

        @Test
        @DisplayName("Should create parking and return ParkingResponse")
        void shouldCreateParking() {
            when(parkingRepository.save(any(Parking.class))).thenReturn(testParking);
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(50L);

            ParkingResponse result = parkingService.createParking(parkingRequest);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Parking Medina");
            assertThat(result.getAddress()).isEqualTo("Medina, Marrakech");
            assertThat(result.getTotalSlots()).isEqualTo(50);
            assertThat(result.getPricePerHour()).isEqualTo(8.0);
            assertThat(result.getActive()).isTrue();
            assertThat(result.getAvailableSlots()).isEqualTo(50L);
            verify(parkingRepository).save(any(Parking.class));
        }
    }

    @Nested
    @DisplayName("updateParking()")
    class UpdateParkingTests {

        @Test
        @DisplayName("Should update existing parking")
        void shouldUpdateParking() {
            ParkingRequest updateRequest = new ParkingRequest();
            updateRequest.setName("Parking Medina Updated");
            updateRequest.setAddress("Medina Centre, Marrakech");
            updateRequest.setDescription("Updated description");
            updateRequest.setTotalSlots(60);
            updateRequest.setPricePerHour(12.0);
            updateRequest.setLatitude(31.6260);
            updateRequest.setLongitude(-7.9890);

            Parking updatedParking = Parking.builder()
                    .id(1L)
                    .name("Parking Medina Updated")
                    .address("Medina Centre, Marrakech")
                    .description("Updated description")
                    .totalSlots(60)
                    .pricePerHour(12.0)
                    .active(true)
                    .latitude(31.6260)
                    .longitude(-7.9890)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(parkingRepository.findById(1L)).thenReturn(Optional.of(testParking));
            when(parkingRepository.save(any(Parking.class))).thenReturn(updatedParking);
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(60L);

            ParkingResponse result = parkingService.updateParking(1L, updateRequest);

            assertThat(result.getName()).isEqualTo("Parking Medina Updated");
            assertThat(result.getTotalSlots()).isEqualTo(60);
            assertThat(result.getPricePerHour()).isEqualTo(12.0);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException when parking not found")
        void shouldThrowWhenParkingNotFound() {
            when(parkingRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingService.updateParking(999L, parkingRequest))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Parking not found with id: 999");
        }
    }

    @Nested
    @DisplayName("deleteParking()")
    class DeleteParkingTests {

        @Test
        @DisplayName("Should delete existing parking")
        void shouldDeleteParking() {
            when(parkingRepository.findById(1L)).thenReturn(Optional.of(testParking));

            parkingService.deleteParking(1L);

            verify(parkingRepository).delete(testParking);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existing parking")
        void shouldThrowWhenParkingNotFound() {
            when(parkingRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingService.deleteParking(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Parking not found with id: 999");
        }
    }

    @Nested
    @DisplayName("getParkingById()")
    class GetParkingByIdTests {

        @Test
        @DisplayName("Should return parking by ID")
        void shouldReturnParkingById() {
            when(parkingRepository.findById(1L)).thenReturn(Optional.of(testParking));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(30L);

            ParkingResponse result = parkingService.getParkingById(1L);

            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getName()).isEqualTo("Parking Medina");
            assertThat(result.getAvailableSlots()).isEqualTo(30L);
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for non-existing parking")
        void shouldThrowWhenNotFound() {
            when(parkingRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> parkingService.getParkingById(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getAllParkings()")
    class GetAllParkingsTests {

        @Test
        @DisplayName("Should return all parkings")
        void shouldReturnAllParkings() {
            when(parkingRepository.findAll()).thenReturn(List.of(testParking));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(50L);

            List<ParkingResponse> result = parkingService.getAllParkings();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Parking Medina");
        }

        @Test
        @DisplayName("Should return empty list when no parkings")
        void shouldReturnEmpty() {
            when(parkingRepository.findAll()).thenReturn(Collections.emptyList());

            List<ParkingResponse> result = parkingService.getAllParkings();

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getActiveParkings()")
    class GetActiveParkingsTests {

        @Test
        @DisplayName("Should return only active parkings")
        void shouldReturnActiveParkings() {
            when(parkingRepository.findByActiveTrue()).thenReturn(List.of(testParking));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(45L);

            List<ParkingResponse> result = parkingService.getActiveParkings();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("searchParkings()")
    class SearchParkingsTests {

        @Test
        @DisplayName("Should find parkings by name (case-insensitive)")
        void shouldSearchByName() {
            when(parkingRepository.findByNameContainingIgnoreCase("medina"))
                    .thenReturn(List.of(testParking));
            when(parkingSlotRepository.countByParkingIdAndStatus(eq(1L), eq(SlotStatus.AVAILABLE)))
                    .thenReturn(50L);

            List<ParkingResponse> result = parkingService.searchParkings("medina");

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).contains("Medina");
        }

        @Test
        @DisplayName("Should return empty list when no match")
        void shouldReturnEmptyWhenNoMatch() {
            when(parkingRepository.findByNameContainingIgnoreCase("nonexistent"))
                    .thenReturn(Collections.emptyList());

            List<ParkingResponse> result = parkingService.searchParkings("nonexistent");

            assertThat(result).isEmpty();
        }
    }
}

