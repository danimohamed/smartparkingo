package org.example.smartparking.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown for client errors. Carries an i18n {@code messageKey} so the
 * {@link GlobalExceptionHandler} can resolve it against the request locale.
 * The legacy String constructor is kept for backwards compatibility — when used,
 * the literal message becomes both the key and the fallback text.
 */
@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {

    private final String messageKey;
    private final transient Object[] args;

    public BadRequestException(String message) {
        super(message);
        this.messageKey = message;
        this.args = new Object[0];
    }

    public BadRequestException(String messageKey, Object... args) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = args == null ? new Object[0] : args;
    }

    public String getMessageKey() { return messageKey; }
    public Object[] getArgs() { return args; }
}
