package org.example.smartparking.exception;

import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.util.Messages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GlobalExceptionHandlerTest {

    @Mock
    private Messages messages;

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler(messages);
        when(messages.get(anyString())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void dataIntegrity_duplicateSqlMessage_returnsBadRequest() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "constraint", new SQLException("Duplicate entry 'x' for key 'parkings.UK_name'"));
        ResponseEntity<ApiResponse<?>> res = handler.handleDataIntegrity(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessageKey()).isEqualTo("parking.duplicateName");
    }

    @Test
    void dataIntegrity_duplicateKeyException_returnsBadRequest() {
        DuplicateKeyException dup = new DuplicateKeyException("dup");
        DataIntegrityViolationException ex = new DataIntegrityViolationException("wrap", dup);
        ResponseEntity<ApiResponse<?>> res = handler.handleDataIntegrity(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void dataIntegrity_otherSql_returnsConflict() {
        DataIntegrityViolationException ex = new DataIntegrityViolationException(
                "other", new SQLException("foreign key violation"));
        ResponseEntity<ApiResponse<?>> res = handler.handleDataIntegrity(ex);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(res.getBody()).isNotNull();
        assertThat(res.getBody().getMessageKey()).isEqualTo("common.error.conflict");
    }
}
