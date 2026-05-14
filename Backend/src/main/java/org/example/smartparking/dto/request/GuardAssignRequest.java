package org.example.smartparking.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GuardAssignRequest {

    /** Guard user ids (role GUARD). Empty list clears assignments for this parking. */
    @NotNull(message = "guardUserIds is required (use empty array to clear)")
    private List<Long> guardUserIds = new ArrayList<>();
}
