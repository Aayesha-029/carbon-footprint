// package com.ecotrack.carbon.dto.request;

// import lombok.Data;
// import java.math.BigDecimal;
// import java.time.LocalDate;

// @Data
// public class GoalRequest {
//     private Long userId;
//     private String goalName;
//     private String category;
//     private BigDecimal targetCO2;
//     private LocalDate startDate;
//     private LocalDate endDate;
// }

package com.ecotrack.carbon.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data  // Add this
public class GoalRequest {
    private Long userId;
    private String goalName;
    private String category;
    private BigDecimal targetCO2;
    private LocalDate startDate;
    private LocalDate endDate;
}