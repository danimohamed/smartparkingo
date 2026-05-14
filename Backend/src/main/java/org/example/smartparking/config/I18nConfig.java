package org.example.smartparking.config;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;
import java.util.Locale;

/**
 * Internationalization configuration.
 * <p>
 * - Default & fallback locale: French ({@link Locale#FRENCH}).
 * - Locale resolved from the {@code Accept-Language} HTTP header.
 * - Supported: fr, en (Arabic ready — just drop in {@code messages_ar.properties}
 *   and add it to {@link #localeResolver()}'s supported list).
 */
@Configuration
public class I18nConfig implements WebMvcConfigurer {

    public static final Locale DEFAULT_LOCALE = Locale.FRENCH;

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource ms = new ReloadableResourceBundleMessageSource();
        ms.setBasename("classpath:i18n/messages");
        ms.setDefaultEncoding("UTF-8");
        ms.setDefaultLocale(DEFAULT_LOCALE);
        // Critical: do NOT fall back to the JVM/system locale — always to French.
        ms.setFallbackToSystemLocale(false);
        ms.setUseCodeAsDefaultMessage(false);
        ms.setCacheSeconds(60);
        return ms;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(Locale.FRENCH, Locale.ENGLISH));
        resolver.setDefaultLocale(DEFAULT_LOCALE);
        return resolver;
    }

    /**
     * Wire the message source into bean validation so JSR-380 annotations
     * like {@code @NotBlank(message = "{validation.notBlank}")} resolve from
     * our bundle and respect the request locale.
     */
    @Bean
    public LocalValidatorFactoryBean validator(MessageSource messageSource) {
        LocalValidatorFactoryBean v = new LocalValidatorFactoryBean();
        v.setValidationMessageSource(messageSource);
        return v;
    }
}

