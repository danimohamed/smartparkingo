package org.example.smartparking.util;

import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

import org.example.smartparking.config.I18nConfig;

/**
 * Tiny helper around {@link MessageSource} so services & controllers can
 * resolve i18n keys without injecting {@code MessageSource} everywhere.
 *
 * <p>Resolution order:
 * <ol>
 *   <li>Current request locale ({@link LocaleContextHolder#getLocale()})</li>
 *   <li>{@link I18nConfig#DEFAULT_LOCALE} (French)</li>
 *   <li>The key itself (so callers always get a printable string)</li>
 * </ol>
 */
@Component
public class Messages {

    private final MessageSource messageSource;

    public Messages(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    /** Resolve {@code key} for the current request locale. */
    public String get(String key, Object... args) {
        return get(LocaleContextHolder.getLocale(), key, args);
    }

    /** Resolve {@code key} for an explicit locale (with French fallback). */
    public String get(Locale locale, String key, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (NoSuchMessageException ex) {
            try {
                return messageSource.getMessage(key, args, I18nConfig.DEFAULT_LOCALE);
            } catch (NoSuchMessageException ignored) {
                return key;
            }
        }
    }
}

