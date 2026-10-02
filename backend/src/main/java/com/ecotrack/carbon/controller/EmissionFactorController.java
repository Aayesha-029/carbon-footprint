package com.ecotrack.carbon.controller;

import com.ecotrack.carbon.entity.EmissionFactor;
import com.ecotrack.carbon.repository.EmissionFactorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emission-factors")
@RequiredArgsConstructor
public class EmissionFactorController {

    private final EmissionFactorRepository emissionFactorRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER','USER')")
    public ResponseEntity<List<EmissionFactor>> getAll() {
        return ResponseEntity.ok(emissionFactorRepository.findAll());
    }
}