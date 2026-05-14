package org.example.smartparking.exception;

import org.example.smartparking.dto.response.ApiResponse;
import org.example.smartparking.util.Messages;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private final Messages messages;

    public GlobalExceptionHandler(Messages messages) {
        this.messages = messages;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<?>> handleResourceNotFound(ResourceNotFoundException ex) {
        String localized = messages.get(ex.getMessageKey(), ex.getArgs());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.errorKey(ex.getMessageKey(), localized));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<?>> handleBadRequest(BadRequestException ex) {
        String localized = messages.get(ex.getMessageKey(), ex.getArgs());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.errorKey(ex.getMessageKey(), localized));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<?>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.errorKey("auth.login.invalidCredentials",
                        messages.get("auth.login.invalidCredentials")));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.errorKey("common.error.forbidden",
                        messages.get("common.error.forbidden")));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<?>> handleDataIntegrity(DataIntegrityViolationException ex) {
        Throwable cause = ex.getMostSpecificCause();
        if (cause instanceof DuplicateKeyException || isLikelyDuplicateKeyConstraint(cause, ex)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.errorKey("parking.duplicateName",
                            messages.get("parking.duplicateName")));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.errorKey("common.error.conflict",
                        messages.get("common.error.conflict")));
    }

    private static boolean isLikelyDuplicateKeyConstraint(Throwable cause, DataIntegrityViolationException ex) {
        String message = cause != null ? cause.getMessage() : ex.getMessage();
        if (message == null || message.isEmpty()) {
            return false;
        }
        return message.contains("Duplicate entry")
                || message.contains("UK_")
                || message.contains("unique");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            // Bean Validation already resolved against our MessageSource (see I18nConfig#validator),
            // so error.getDefaultMessage() is already localized to the request locale.
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        String summary = String.join(", ", errors.values());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message(summary)
                        .messageKey("validation.failed")
                        .data(errors)
                        .timestamp(java.time.LocalDateTime.now())
                        .build());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<?>> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.errorKey("common.error.unexpected",
                        messages.get("common.error.unexpected") + ": " + ex.getMessage()));
    }
}
