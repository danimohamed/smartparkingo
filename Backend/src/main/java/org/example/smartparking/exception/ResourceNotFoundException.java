package org.example.smartparking.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a domain entity is not found. Carries an i18n {@code messageKey}
 * resolved by {@link GlobalExceptionHandler} against the request locale.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    private final String messageKey;
    private final transient Object[] args;

    public ResourceNotFoundException(String message) {
        super(message);
        this.messageKey = message;
        this.args = new Object[0];
    }

    public ResourceNotFoundException(String messageKey, Object... args) {
        super(messageKey);
        this.messageKey = messageKey;
        this.args = args == null ? new Object[0] : args;
    }

    public String getMessageKey() { return messageKey; }
    public Object[] getArgs() { return args; }
}
