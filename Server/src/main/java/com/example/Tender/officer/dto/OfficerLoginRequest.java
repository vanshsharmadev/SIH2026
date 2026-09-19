package com.example.Tender.officer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerLoginRequest {

    @NotBlank(message = "Email or Mobile cannot be blank")
    private String emailOrMobile;

    @NotBlank(message = "Password cannot be blank")
    private String password;
}
