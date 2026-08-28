package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.BidderAuthResponse;
import com.example.Tender.bidder.dto.BidderLoginRequest;
import com.example.Tender.bidder.dto.BidderSignupRequest;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.repository.BidderRepository;
import com.example.Tender.bidder.security.BidderPrincipal;
import com.example.Tender.bidder.security.service.jwt.BidderJwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BidderAuthService {

    private final BidderRepository bidderRepository;
    private final PasswordEncoder passwordEncoder;
    private final BidderJwtUtils bidderJwtUtils;

    public BidderAuthResponse signup(BidderSignupRequest request) {

        if (bidderRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Bidder with this email already exists");
        }

        Bidder bidder = new Bidder();

        bidder.setEmail(request.getEmail());
        bidder.setPassword(
                passwordEncoder.encode(request.getPassword())
        );
        bidder.setLegalName(request.getLegalName());

        Bidder savedBidder = bidderRepository.save(bidder);

        return new BidderAuthResponse(
                null,
                savedBidder.getId(),
                savedBidder.getEmail(),
                savedBidder.getLegalName()
        );
    }

    public BidderAuthResponse login(BidderLoginRequest request) {

        Bidder bidder = bidderRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password")
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                bidder.getPassword()
        )) {
            throw new RuntimeException("Invalid email or password");
        }

        BidderPrincipal bidderPrincipal =
                new BidderPrincipal(bidder);

        Authentication authentication =
                new UsernamePasswordAuthenticationToken(
                        bidderPrincipal,
                        null,
                        bidderPrincipal.getAuthorities()
                );

        String token =
                bidderJwtUtils.generateJwtToken(authentication);

        return new BidderAuthResponse(
                token,
                bidder.getId(),
                bidder.getEmail(),
                bidder.getLegalName()
        );
    }
}