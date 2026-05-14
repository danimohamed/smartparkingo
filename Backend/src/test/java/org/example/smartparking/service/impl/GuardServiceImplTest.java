package org.example.smartparking.service.impl;

import org.example.smartparking.dto.response.GuardScanResultResponse;
import org.example.smartparking.dto.response.PlateOcrResponse;
import org.example.smartparking.exception.ResourceNotFoundException;
import org.example.smartparking.repository.ParkingGuardRepository;
import org.example.smartparking.repository.ParkingRepository;
import org.example.smartparking.repository.ParkingSlotRepository;
import org.example.smartparking.repository.ReservationRepository;
import org.example.smartparking.repository.UserRepository;
import org.example.smartparking.repository.WalkInParkingSessionRepository;
import org.example.smartparking.service.AlprClient;
import org.example.smartparking.service.ReservationQrService;
import org.example.smartparking.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GuardServiceImplTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private UserRepository userRepository;
    @Mock private ParkingRepository parkingRepository;
    @Mock private ParkingGuardRepository parkingGuardRepository;
    @Mock private ParkingSlotRepository parkingSlotRepository;
    @Mock private WalkInParkingSessionRepository walkInParkingSessionRepository;
    @Mock private ReservationQrService reservationQrService;
    @Mock private ReservationService reservationService;
    @Mock private AlprClient alprClient;

    @InjectMocks
    private GuardServiceImpl guardService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(guardService, "minOcrConfidence", 0.55);
    }

    @Test
    void validateEntry_invalidQr_returnsNotValid() {
        when(reservationQrService.verifyAndParse("bad")).thenThrow(new IllegalArgumentException("Invalid token"));
        GuardScanResultResponse r = guardService.validateEntry("bad", "guard@parking.com");
        assertThat(r.isValid()).isFalse();
        assertThat(r.getMessage()).contains("Invalid");
    }

    @Test
    void validateExit_invalidQr_returnsNotValid() {
        when(reservationQrService.verifyAndParse("x")).thenThrow(new IllegalStateException("expired"));
        GuardScanResultResponse r = guardService.validateExit("x", "guard@parking.com");
        assertThat(r.isValid()).isFalse();
        assertThat(r.getMessage()).isEqualTo("expired");
    }

    @Test
    void validateEntryByReservationId_missing_throws() {
        when(reservationRepository.findByIdWithDetails(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> guardService.validateEntryByReservationId(99L, "guard@parking.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void readPlate_emptyBytes_returnsMessage() {
        PlateOcrResponse r = guardService.readPlate(new byte[0], "a.jpg");
        assertThat(r.getConfidence()).isZero();
        assertThat(r.getMessage()).contains("Empty image");
    }

    @Test
    void readPlate_alprNotConfigured_returnsMessage() {
        when(alprClient.isConfigured()).thenReturn(false);
        PlateOcrResponse r = guardService.readPlate(new byte[] { 1, 2, 3 }, "a.jpg");
        assertThat(r.getMessage()).contains("not configured");
    }

    @Test
    void readPlate_successHighConfidence_returnsSuccessMessage() {
        when(alprClient.isConfigured()).thenReturn(true);
        when(alprClient.readPlate(any(), anyString()))
                .thenReturn(Optional.of(new AlprClient.PlateRead("ABC-123", 0.9)));
        PlateOcrResponse r = guardService.readPlate(new byte[] { 9 }, "p.jpg");
        assertThat(r.getPlate()).isEqualTo("ABC-123");
        assertThat(r.getMessage()).contains("successfully");
    }

    @Test
    void readPlate_lowConfidence_returnsRetakeMessage() {
        when(alprClient.isConfigured()).thenReturn(true);
        when(alprClient.readPlate(any(), anyString()))
                .thenReturn(Optional.of(new AlprClient.PlateRead("XYZ", 0.1)));
        PlateOcrResponse r = guardService.readPlate(new byte[] { 1 }, "p.jpg");
        assertThat(r.getMessage()).contains("Low confidence");
    }

    @Test
    void readPlate_noDetection_returnsNoPlate() {
        when(alprClient.isConfigured()).thenReturn(true);
        when(alprClient.readPlate(any(), anyString())).thenReturn(Optional.empty());
        PlateOcrResponse r = guardService.readPlate(new byte[] { 1 }, "p.jpg");
        assertThat(r.getMessage()).contains("No license plate");
    }
}
