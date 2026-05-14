package org.example.smartparking.exception;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DomainExceptionsTest {

    @Test
    void badRequest_stringConstructor() {
        BadRequestException ex = new BadRequestException("key.only");
        assertThat(ex.getMessageKey()).isEqualTo("key.only");
        assertThat(ex.getArgs()).isEmpty();
    }

    @Test
    void badRequest_keyAndArgs() {
        BadRequestException ex = new BadRequestException("err.code", "a", 1);
        assertThat(ex.getMessageKey()).isEqualTo("err.code");
        assertThat(ex.getArgs()).containsExactly("a", 1);
    }

    @Test
    void badRequest_nullArgsBecomesEmpty() {
        BadRequestException ex = new BadRequestException("k", (Object[]) null);
        assertThat(ex.getArgs()).isEmpty();
    }

    @Test
    void resourceNotFound_stringConstructor() {
        ResourceNotFoundException ex = new ResourceNotFoundException("not.found");
        assertThat(ex.getMessageKey()).isEqualTo("not.found");
        assertThat(ex.getArgs()).isEmpty();
    }

    @Test
    void resourceNotFound_keyAndArgs() {
        ResourceNotFoundException ex = new ResourceNotFoundException("id.missing", 42L);
        assertThat(ex.getMessageKey()).isEqualTo("id.missing");
        assertThat(ex.getArgs()).containsExactly(42L);
    }
}
