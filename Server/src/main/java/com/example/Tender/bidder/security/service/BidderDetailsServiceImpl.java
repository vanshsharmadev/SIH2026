package com.example.Tender.bidder.security.service;

import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BidderDetailsServiceImpl implements UserDetailsService {

    private final BidderRepository bidderRepository;

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        Bidder bidder = bidderRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("Bidder not found with email: " + email)
                );

        return new BidderPrincipal(bidder);
    }
}