package com.example.Tender.bidder.service;

import com.example.Tender.bidder.dto.BidderResponse;
import com.example.Tender.bidder.dto.CreateBidderRequest;
import com.example.Tender.bidder.dto.UpdateBidderRequest;
import com.example.Tender.bidder.entity.Bidder;
import com.example.Tender.bidder.exception.BidderNotFoundException;
import com.example.Tender.bidder.repository.BidderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BidderService {

    private final BidderRepository bidderRepository;

    public List<BidderResponse> getAllBidders() {
        return bidderRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public BidderResponse getBidderById(Long id) {

        Bidder bidder = bidderRepository.findById(id)
                .orElseThrow(() -> new BidderNotFoundException("Bidder not found"));

        return mapToResponse(bidder);
    }

    public BidderResponse updateBidder(Long id, UpdateBidderRequest request) {

        Bidder bidder = bidderRepository.findById(id)
                .orElseThrow(() -> new BidderNotFoundException("Bidder not found"));

        bidder.setLegalName(request.getLegalName());
        if (request.getCompanyName() != null) {
            bidder.setCompanyName(request.getCompanyName());
        }
        bidder.setPanNumber(request.getPanNumber());
        bidder.setGstNumber(request.getGstNumber());
        bidder.setUdyamNumber(request.getUdyamNumber());
        bidder.setRegistrationNumber(request.getRegistrationNumber());
        bidder.setEmail(request.getEmail());
        bidder.setPhone(request.getPhone());
        bidder.setAddress(request.getAddress());
        bidder.setProfileMetadata(request.getProfileMetadata());

        Bidder updatedBidder = bidderRepository.save(bidder);

        return mapToResponse(updatedBidder);
    }

    public void deleteBidder(Long id) {

        Bidder bidder = bidderRepository.findById(id)
                .orElseThrow(() -> new BidderNotFoundException("Bidder not found"));

        bidderRepository.delete(bidder);
    }

    private BidderResponse mapToResponse(Bidder bidder) {

        BidderResponse response = new BidderResponse();

        response.setId(bidder.getId());
        response.setLegalName(bidder.getLegalName());
        response.setCompanyName(bidder.getCompanyName());
        response.setPanNumber(bidder.getPanNumber());
        response.setGstNumber(bidder.getGstNumber());
        response.setUdyamNumber(bidder.getUdyamNumber());
        response.setRegistrationNumber(bidder.getRegistrationNumber());
        response.setEmail(bidder.getEmail());
        response.setPhone(bidder.getPhone());
        response.setAddress(bidder.getAddress());
        response.setProfileMetadata(bidder.getProfileMetadata());
        response.setCreatedAt(bidder.getCreatedAt());
        response.setUpdatedAt(bidder.getUpdatedAt());

        return response;
    }
}