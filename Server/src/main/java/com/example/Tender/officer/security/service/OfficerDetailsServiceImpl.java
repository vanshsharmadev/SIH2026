package com.example.Tender.officer.security.service;

import com.example.Tender.officer.model.Officer;
import com.example.Tender.officer.repository.OfficerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OfficerDetailsServiceImpl implements UserDetailsService {

    private final OfficerRepository officerRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String emailOrMobile) throws UsernameNotFoundException {
        Officer officer = officerRepository.findByEmailOrMobile(emailOrMobile, emailOrMobile)
                .orElseThrow(() -> new UsernameNotFoundException("Officer not found with email or mobile: " + emailOrMobile));

        return OfficerPrincipal.build(officer);
    }
}
