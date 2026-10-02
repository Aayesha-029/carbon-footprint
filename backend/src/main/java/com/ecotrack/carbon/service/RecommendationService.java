package com.ecotrack.carbon.service;

import com.ecotrack.carbon.dto.response.RecommendationResponse;
import com.ecotrack.carbon.entity.ActivityLog;
import com.ecotrack.carbon.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final ActivityLogRepository activityLogRepository;

    private static final Map<String, Map<String, String>> RECOMMENDATION_TIPS = new HashMap<>();
    
    static {
        // Transport tips
        Map<String, String> transportTips = new HashMap<>();
        transportTips.put("CAR", "Consider carpooling or using public transit for your daily commute. You could save up to 30% on your transport emissions.");
        transportTips.put("FLIGHT", "Consider virtual meetings instead of business flights. If flying is necessary, choose direct flights which are more fuel-efficient.");
        transportTips.put("PUBLIC TRANSIT", "Great job using public transit! Consider combining with bike or walking for short distances.");
        transportTips.put("BIKE", "Excellent choice! Continue using bike for short commutes.");
        transportTips.put("WALK", "Walking is the most eco-friendly option. Try to walk for distances under 2 km.");
        RECOMMENDATION_TIPS.put("Transport", transportTips);

        // Electricity tips
        Map<String, String> electricityTips = new HashMap<>();
        electricityTips.put("GRID", "Switch to renewable energy sources like solar or wind. Install energy-efficient appliances and LED bulbs.");
        electricityTips.put("SOLAR", "Great job using solar energy! Consider adding battery storage for better efficiency.");
        electricityTips.put("WIND", "Excellent choice! Wind energy is clean and renewable.");
        electricityTips.put("HYDRO", "Hydro power is a clean energy source. Continue using it!");
        RECOMMENDATION_TIPS.put("Electricity", electricityTips);

        // Food tips
        Map<String, String> foodTips = new HashMap<>();
        foodTips.put("BEEF", "Consider reducing beef consumption. Try plant-based alternatives like Beyond Meat or tofu.");
        foodTips.put("CHICKEN", "Chicken has a lower carbon footprint than beef. Try to replace some beef meals with chicken.");
        foodTips.put("PORK", "Pork has a moderate carbon footprint. Consider reducing pork consumption.");
        foodTips.put("FISH", "Choose sustainably sourced fish. Reduce fish consumption to once a week.");
        foodTips.put("VEGETARIAN", "Great choice! Vegetarian meals have significantly lower carbon footprint.");
        foodTips.put("VEGAN", "Excellent! Vegan meals have the lowest carbon footprint among all food options.");
        RECOMMENDATION_TIPS.put("Food", foodTips);

        // Shopping tips
        Map<String, String> shoppingTips = new HashMap<>();
        shoppingTips.put("CLOTHING", "Consider buying second-hand clothing or from sustainable brands. Reduce fast fashion purchases.");
        shoppingTips.put("ELECTRONICS", "Choose energy-efficient electronics. Consider buying refurbished products.");
        shoppingTips.put("FURNITURE", "Buy furniture from sustainable sources. Consider second-hand or upcycled furniture.");
        shoppingTips.put("BOOKS", "Consider digital books or library borrowing instead of buying new books.");
        RECOMMENDATION_TIPS.put("Shopping", shoppingTips);
    }

    public List<RecommendationResponse> getRecommendations(Long userId) {
        List<ActivityLog> activities = activityLogRepository.findByUserIdOrderByLogDateDesc(userId);
        
        if (activities.isEmpty()) {
            return getDefaultRecommendations();
        }

        // Find top 3 highest emission activities in last 30 days
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityLog> recentActivities = activities.stream()
                .filter(a -> a.getLogDate().isAfter(thirtyDaysAgo))
                .collect(Collectors.toList());

        if (recentActivities.isEmpty()) {
            return getDefaultRecommendations();
        }

        // Group by category and activity type
        Map<String, BigDecimal> emissionsByType = new HashMap<>();
        for (ActivityLog log : recentActivities) {
            String key = log.getCategory() + ":" + log.getActivityType();
            emissionsByType.merge(key, log.getCo2eKg(), BigDecimal::add);
        }

        // Sort by emission value descending and get top 3
        List<Map.Entry<String, BigDecimal>> sorted = emissionsByType.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .limit(3)
                .collect(Collectors.toList());

        List<RecommendationResponse> recommendations = new ArrayList<>();
        int id = 1;

        for (Map.Entry<String, BigDecimal> entry : sorted) {
            String[] parts = entry.getKey().split(":");
            String category = parts[0];
            String activityType = parts[1];
            BigDecimal emissions = entry.getValue();

            Map<String, String> categoryTips = RECOMMENDATION_TIPS.get(category);
            String tip = categoryTips != null ? categoryTips.getOrDefault(activityType, 
                    "Consider reducing your " + category.toLowerCase() + " activities.") : 
                    "Consider reducing your " + category.toLowerCase() + " activities.";

            RecommendationResponse rec = new RecommendationResponse();
            rec.setId((long) id++);
            rec.setCategory(category);
            rec.setPriority("High");
            rec.setPotentialSavings(emissions.multiply(BigDecimal.valueOf(0.3)).setScale(2, RoundingMode.HALF_UP));
            rec.setTip(tip);
            
            // Set title based on category
            switch (category) {
                case "Transport":
                    rec.setTitle("Reduce Your " + activityType + " Usage");
                    rec.setIcon("🚗");
                    rec.setColor("#22c55e");
                    break;
                case "Electricity":
                    rec.setTitle("Reduce Your Electricity Consumption");
                    rec.setIcon("💡");
                    rec.setColor("#3b82f6");
                    break;
                case "Food":
                    rec.setTitle("Optimize Your " + activityType + " Consumption");
                    rec.setIcon("🍽️");
                    rec.setColor("#f59e0b");
                    break;
                case "Shopping":
                    rec.setTitle("Shop More Sustainably");
                    rec.setIcon("🛍️");
                    rec.setColor("#8b5cf6");
                    break;
                default:
                    rec.setTitle("Reduce Your " + category + " Footprint");
                    rec.setIcon("🌱");
                    rec.setColor("#64748b");
            }
            
            rec.setDescription("Your " + activityType.toLowerCase() + " activities contribute " + 
                    emissions.setScale(2, RoundingMode.HALF_UP) + " kg CO₂e to your carbon footprint.");

            recommendations.add(rec);
        }

        // Add general recommendations
        recommendations.add(createGeneralRecommendation(
                "Adopt Zero-Waste Habits", 
                "Use reusable bags, bottles, and containers daily. Avoid single-use plastics.",
                "🌿", "#22c55e", "Medium"));

        recommendations.add(createGeneralRecommendation(
                "Plant Trees to Offset Carbon", 
                "Plant 5-10 trees per year to offset your carbon footprint. Each tree absorbs about 20 kg CO₂e annually.",
                "🌳", "#15803d", "Medium"));

        return recommendations;
    }

    private RecommendationResponse createGeneralRecommendation(String title, String description, 
            String icon, String color, String priority) {
        RecommendationResponse rec = new RecommendationResponse();
        rec.setId((long) (Math.random() * 1000));
        rec.setTitle(title);
        rec.setDescription(description);
        rec.setIcon(icon);
        rec.setColor(color);
        rec.setPriority(priority);
        rec.setCategory("Lifestyle");
        rec.setPotentialSavings(BigDecimal.valueOf(5));
        return rec;
    }

    private List<RecommendationResponse> getDefaultRecommendations() {
        List<RecommendationResponse> defaults = new ArrayList<>();
        
        defaults.add(createGeneralRecommendation(
                "Start Logging Your Activities", 
                "Log your daily activities to get personalized recommendations and track your carbon footprint.",
                "📝", "#3b82f6", "High"));
        
        defaults.add(createGeneralRecommendation(
                "Use Public Transport", 
                "Replace car trips with bus, train, or metro. This can reduce your transport emissions by up to 50%.",
                "🚌", "#22c55e", "High"));
        
        defaults.add(createGeneralRecommendation(
                "Switch to Renewable Energy", 
                "Switch to solar or wind energy for your electricity needs. This can reduce your electricity emissions by up to 80%.",
                "☀️", "#f59e0b", "Medium"));
        
        defaults.add(createGeneralRecommendation(
                "Reduce Meat Consumption", 
                "Try plant-based meals 2-3 times a week. This can reduce your food emissions by up to 30%.",
                "🥗", "#8b5cf6", "Medium"));
        
        defaults.add(createGeneralRecommendation(
                "Buy Sustainable Products", 
                "Choose products from sustainable brands and reduce fast fashion consumption.",
                "♻️", "#22c55e", "Low"));
        
        return defaults;
    }
}