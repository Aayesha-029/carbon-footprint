package com.ecotrack.carbon.service;

import com.ecotrack.carbon.entity.EmissionFactor;
import com.ecotrack.carbon.exception.UnknownActivityTypeException;
import com.ecotrack.carbon.repository.EmissionFactorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class EmissionCalculationService {

    private static final int RESULT_SCALE = 4;
    private final EmissionFactorRepository emissionFactorRepository;

    public BigDecimal calculateCo2e(String category, String activityType, String unit, BigDecimal quantity) {
        return calculateCo2e(category, activityType, unit, quantity, LocalDate.now());
    }

    public BigDecimal calculateCo2e(String category, String activityType, String unit,
                                     BigDecimal quantity, LocalDate asOfDate) {
        if (quantity == null) {
            throw new IllegalArgumentException("Quantity must not be null");
        }
        if (quantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Quantity must not be negative");
        }

        System.out.println("🔍 Calculating CO2e for: " + category + "/" + activityType + "/" + unit);
        
        EmissionFactor factor = findEmissionFactor(category, activityType, unit, asOfDate);
        
        System.out.println("✅ Found factor: " + factor.getFactorKgCo2ePerUnit());

        return quantity.multiply(factor.getFactorKgCo2ePerUnit())
                .setScale(RESULT_SCALE, RoundingMode.HALF_UP);
    }

    public EmissionFactor findEmissionFactor(String category, String activityType, String unit, LocalDate asOfDate) {
        // Normalize inputs
        String normalizedCategory = category != null ? category.trim() : null;
        String normalizedActivityType = activityType != null ? activityType.trim().toUpperCase() : null;
        String normalizedUnit = unit != null ? unit.trim().toLowerCase() : null;

        System.out.println("🔍 Looking for factor: " + normalizedCategory + "/" + normalizedActivityType + "/" + normalizedUnit);

        return emissionFactorRepository
                .findFirstByCategoryAndActivityTypeAndUnitAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                        normalizedCategory, normalizedActivityType, normalizedUnit, asOfDate)
                .orElseThrow(() -> {
                    System.err.println("❌ No factor found for: " + normalizedCategory + "/" + normalizedActivityType + "/" + normalizedUnit);
                    return new UnknownActivityTypeException(
                            category, activityType, unit);
                });
    }
}