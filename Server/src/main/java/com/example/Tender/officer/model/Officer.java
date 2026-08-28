package com.example.Tender.officer.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "officers",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_officers_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_officers_mobile", columnNames = "mobile")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Officer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name cannot be blank")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Email cannot be blank")
    @Email(message = "Email should be valid")
    @Size(max = 100, message = "Email cannot exceed 100 characters")
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "Mobile number cannot be blank")
    @Size(min = 10, max = 15, message = "Mobile number must be between 10 and 15 digits")
    @Pattern(regexp = "^[0-9+()\\-\\s]+$", message = "Invalid mobile number format")
    @Column(name = "mobile", nullable = false, unique = true, length = 20)
    private String mobile;

    @NotBlank(message = "Password cannot be blank")
    @Size(min = 6, max = 120)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 20, nullable = false)
    @Builder.Default
    private OfficerRole role = OfficerRole.ROLE_OFFICER;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20, nullable = false)
    @Builder.Default
    private OfficerVerificationStatus verificationStatus = OfficerVerificationStatus.NOT_VERIFIED;

    @Column(name = "digilocker_id", length = 100, nullable = true)
    private String digilockerId;

    @Column(name = "identity_provider", length = 50, nullable = true)
    private String identityProvider;

    @Column(name = "identity_verified_at", nullable = true)
    private LocalDateTime identityVerifiedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
