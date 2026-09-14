package com.example.Tender.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    @Builder.Default
    private boolean success = true;

    private String message;

    private String token;

    private AuthUserDto user;
}
