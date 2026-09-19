package com.example.Tender.bidder.controller;

import com.example.Tender.bidder.dto.BidderResponse;
import com.example.Tender.bidder.dto.CreateBidderRequest;
import com.example.Tender.bidder.dto.UpdateBidderRequest;
import com.example.Tender.bidder.service.BidderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bidder")
@RequiredArgsConstructor
public class BidderController {

    private final BidderService bidderService;

    @GetMapping
    public ResponseEntity<List<BidderResponse>> getAllBidders() {

        return ResponseEntity.ok(
                bidderService.getAllBidders()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<BidderResponse> getBidderById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bidderService.getBidderById(id)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<BidderResponse> updateBidder(
            @PathVariable Long id,
            @RequestBody UpdateBidderRequest request) {

        return ResponseEntity.ok(
                bidderService.updateBidder(id, request)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBidder(
            @PathVariable Long id) {

        bidderService.deleteBidder(id);

        return ResponseEntity.noContent().build();
    }
}