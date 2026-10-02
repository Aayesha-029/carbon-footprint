package com.ecotrack.carbon.config;

import com.ecotrack.carbon.entity.EmissionFactor;
import com.ecotrack.carbon.repository.EmissionFactorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class DataLoader implements CommandLineRunner {

    private final EmissionFactorRepository emissionFactorRepository;

    @Override
    public void run(String... args) throws Exception {
        // Only load if table is empty
        if (emissionFactorRepository.count() == 0) {
            System.out.println("📊 Loading emission factors...");
            
            // ============ TRANSPORT - KM (Using 'Transport' as category) ============
            saveFactor("Transport", "CAR", "km", 0.171, "IPCC");
            saveFactor("Transport", "FLIGHT", "km", 0.285, "IPCC");
            saveFactor("Transport", "PUBLIC TRANSIT", "km", 0.042, "IPCC");
            saveFactor("Transport", "BIKE", "km", 0.000, "IPCC");
            saveFactor("Transport", "WALK", "km", 0.000, "IPCC");
            
            // ============ TRANSPORT - MILES ============
            saveFactor("Transport", "CAR", "miles", 0.275, "IPCC");
            saveFactor("Transport", "FLIGHT", "miles", 0.459, "IPCC");
            saveFactor("Transport", "PUBLIC TRANSIT", "miles", 0.068, "IPCC");
            saveFactor("Transport", "BIKE", "miles", 0.000, "IPCC");
            saveFactor("Transport", "WALK", "miles", 0.000, "IPCC");

            // ============ TRANSPORTATION - KM (Duplicate for 'Transportation' category) ============
            saveFactor("Transportation", "CAR", "km", 0.171, "IPCC");
            saveFactor("Transportation", "FLIGHT", "km", 0.285, "IPCC");
            saveFactor("Transportation", "PUBLIC TRANSIT", "km", 0.042, "IPCC");
            saveFactor("Transportation", "BIKE", "km", 0.000, "IPCC");
            saveFactor("Transportation", "WALK", "km", 0.000, "IPCC");
            
            // ============ TRANSPORTATION - MILES ============
            saveFactor("Transportation", "CAR", "miles", 0.275, "IPCC");
            saveFactor("Transportation", "FLIGHT", "miles", 0.459, "IPCC");
            saveFactor("Transportation", "PUBLIC TRANSIT", "miles", 0.068, "IPCC");
            saveFactor("Transportation", "BIKE", "miles", 0.000, "IPCC");
            saveFactor("Transportation", "WALK", "miles", 0.000, "IPCC");

            // ============ ELECTRICITY ============
            saveFactor("Electricity", "GRID", "kWh", 0.475, "EPA");
            saveFactor("Electricity", "SOLAR", "kWh", 0.041, "EPA");
            saveFactor("Electricity", "WIND", "kWh", 0.011, "EPA");
            saveFactor("Electricity", "HYDRO", "kWh", 0.024, "EPA");

            // ============ FOOD - Serving ============
            saveFactor("Food", "BEEF", "serving", 6.61, "IPCC");
            saveFactor("Food", "CHICKEN", "serving", 2.10, "IPCC");
            saveFactor("Food", "PORK", "serving", 3.20, "IPCC");
            saveFactor("Food", "FISH", "serving", 1.80, "IPCC");
            saveFactor("Food", "VEGETARIAN", "serving", 0.57, "IPCC");
            saveFactor("Food", "VEGAN", "serving", 0.35, "IPCC");
            
            // ============ FOOD - Meal ============
            saveFactor("Food", "BEEF", "meal", 13.22, "IPCC");
            saveFactor("Food", "CHICKEN", "meal", 4.20, "IPCC");
            saveFactor("Food", "PORK", "meal", 6.40, "IPCC");
            saveFactor("Food", "FISH", "meal", 3.60, "IPCC");
            saveFactor("Food", "VEGETARIAN", "meal", 1.14, "IPCC");
            saveFactor("Food", "VEGAN", "meal", 0.70, "IPCC");

            // ============ SHOPPING - USD ============
            saveFactor("Shopping", "CLOTHING", "USD", 0.012, "EPA");
            saveFactor("Shopping", "ELECTRONICS", "USD", 0.015, "EPA");
            saveFactor("Shopping", "FURNITURE", "USD", 0.010, "EPA");
            saveFactor("Shopping", "BOOKS", "USD", 0.005, "EPA");
            
            // ============ SHOPPING - EUR ============
            saveFactor("Shopping", "CLOTHING", "EUR", 0.013, "EPA");
            saveFactor("Shopping", "ELECTRONICS", "EUR", 0.016, "EPA");
            saveFactor("Shopping", "FURNITURE", "EUR", 0.011, "EPA");
            saveFactor("Shopping", "BOOKS", "EUR", 0.006, "EPA");

            System.out.println("✅ Loaded " + emissionFactorRepository.count() + " emission factors");
        } else {
            System.out.println("✅ Emission factors already loaded: " + emissionFactorRepository.count());
        }
        
        // Print all factors for debugging
        System.out.println("📊 Listing all emission factors:");
        emissionFactorRepository.findAll().forEach(ef -> {
            System.out.println("  - " + ef.getCategory() + "/" + ef.getActivityType() + "/" + ef.getUnit() + " = " + ef.getFactorKgCo2ePerUnit());
        });
    }

    private void saveFactor(String category, String activityType, String unit, double factor, String source) {
        try {
            EmissionFactor ef = new EmissionFactor();
            ef.setCategory(category);
            ef.setActivityType(activityType.toUpperCase());
            ef.setUnit(unit.toLowerCase());
            ef.setFactorKgCo2ePerUnit(BigDecimal.valueOf(factor));
            ef.setSource(source);
            ef.setEffectiveDate(LocalDate.of(2024, 1, 1));
            emissionFactorRepository.save(ef);
        } catch (Exception e) {
            System.err.println("⚠️ Error saving factor: " + category + "/" + activityType + "/" + unit);
        }
    }
}