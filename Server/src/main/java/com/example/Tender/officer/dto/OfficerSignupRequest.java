package com.example.Tender.officer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficerSignupRequest {

    @NotBlank(message = "Name cannot be blank")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email cannot be blank")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Email(message = "Email must be a valid email address")
    @Pattern(
            regexp = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
            message = "Email must be a valid email address format (e.g., user@example.com)"
    )
    private String email;

    @NotBlank(message = "Mobile number cannot be blank")
    @Size(min = 10, max = 15, message = "Mobile number must be between 10 and 15 digits")
    @Pattern(regexp = "^[0-9+()\\-\\s]+$", message = "Invalid mobile number format")
    private String mobile;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 8, max = 40, message = "Password must be between 8 and 40 characters")
    @Pattern(
            regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!._*~-]).*$",
            message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@#$%^&+=!._*~-)"
    )
    private String password;
}
