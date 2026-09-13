package com.example.Tender.bidder.security;

import com.example.Tender.bidder.entity.Bidder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class BidderPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String legalName;
    private final String companyName;

    public BidderPrincipal(Bidder bidder) {
        this.id = bidder.getId();
        this.email = bidder.getEmail();
        this.password = bidder.getPassword();
        this.legalName = bidder.getLegalName();
        this.companyName = bidder.getCompanyName();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_BIDDER"));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }
}