package com.ecotrack.carbon.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "emission_factors")
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String category;

    @Column(name = "activity_type", nullable = false)
    private String activityType;

    @Column(nullable = false)
    private String unit;

    @Column(name = "factor_kg_co2e_per_unit", nullable = false)
    private BigDecimal factorKgCo2ePerUnit;

    @Column(nullable = false)
    private String source;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    // ============ GETTERS AND SETTERS ============
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public BigDecimal getFactorKgCo2ePerUnit() { return factorKgCo2ePerUnit; }
    public void setFactorKgCo2ePerUnit(BigDecimal factorKgCo2ePerUnit) { this.factorKgCo2ePerUnit = factorKgCo2ePerUnit; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
}