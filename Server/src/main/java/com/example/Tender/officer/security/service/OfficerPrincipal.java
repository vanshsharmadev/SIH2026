package com.example.Tender.officer.security.service;

import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.model.OfficerRole;
import com.example.Tender.officer.model.OfficerVerificationStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@AllArgsConstructor
@Getter
public class OfficerPrincipal implements UserDetails {

    private Long id;
    private String name;
    private String email;
    private String mobile;

    @JsonIgnore
    private String password;

    private OfficerRole role;
    private OfficerVerificationStatus verificationStatus;
    private Collection<? extends GrantedAuthority> authorities;

    public static OfficerPrincipal build(Officer officer) {
        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(officer.getRole().name())
        );

        return new OfficerPrincipal(
                officer.getId(),
                officer.getName(),
                officer.getEmail(),
                officer.getMobile(),
                officer.getPassword(),
                officer.getRole(),
                officer.getVerificationStatus(),
                authorities
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        OfficerPrincipal officer = (OfficerPrincipal) o;
        return Objects.equals(id, officer.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
