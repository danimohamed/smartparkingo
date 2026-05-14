package org.example.smartparking.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private boolean success;
    private String message;
    /** i18n key (e.g. {@code "parking.create.success"}) — clients may use it for client-side overrides. */
    private String messageKey;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Operation successful")
                .messageKey("common.success")
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /** Preferred factory: backend resolves message via i18n bundle, ships both key + localized text. */
    public static <T> ApiResponse<T> successKey(String messageKey, String localizedMessage, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(localizedMessage)
                .messageKey(messageKey)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static <T> ApiResponse<T> errorKey(String messageKey, String localizedMessage) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(localizedMessage)
                .messageKey(messageKey)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
