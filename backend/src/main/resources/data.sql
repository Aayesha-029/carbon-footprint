-- Insert emission factors for all categories
INSERT INTO emission_factors (category, activity_type, unit, factor_kg_co2e_per_unit, source, effective_date) VALUES
-- TRANSPORT
('Transport', 'CAR', 'km', 0.171, 'IPCC', '2024-01-01'),
('Transport', 'FLIGHT', 'km', 0.285, 'IPCC', '2024-01-01'),
('Transport', 'PUBLIC TRANSIT', 'km', 0.042, 'IPCC', '2024-01-01'),
('Transport', 'BIKE', 'km', 0.000, 'IPCC', '2024-01-01'),
('Transport', 'WALK', 'km', 0.000, 'IPCC', '2024-01-01'),

-- ELECTRICITY
('Electricity', 'GRID', 'kWh', 0.475, 'EPA', '2024-01-01'),
('Electricity', 'SOLAR', 'kWh', 0.041, 'EPA', '2024-01-01'),
('Electricity', 'WIND', 'kWh', 0.011, 'EPA', '2024-01-01'),
('Electricity', 'HYDRO', 'kWh', 0.024, 'EPA', '2024-01-01'),

-- FOOD
('Food', 'BEEF', 'serving', 6.610, 'IPCC', '2024-01-01'),
('Food', 'CHICKEN', 'serving', 2.100, 'IPCC', '2024-01-01'),
('Food', 'PORK', 'serving', 3.200, 'IPCC', '2024-01-01'),
('Food', 'FISH', 'serving', 1.800, 'IPCC', '2024-01-01'),
('Food', 'VEGETARIAN', 'serving', 0.570, 'IPCC', '2024-01-01'),
('Food', 'VEGAN', 'serving', 0.350, 'IPCC', '2024-01-01'),
('Food', 'BEEF', 'meal', 13.220, 'IPCC', '2024-01-01'),
('Food', 'CHICKEN', 'meal', 4.200, 'IPCC', '2024-01-01'),
('Food', 'PORK', 'meal', 6.400, 'IPCC', '2024-01-01'),
('Food', 'FISH', 'meal', 3.600, 'IPCC', '2024-01-01'),
('Food', 'VEGETARIAN', 'meal', 1.140, 'IPCC', '2024-01-01'),
('Food', 'VEGAN', 'meal', 0.700, 'IPCC', '2024-01-01'),

-- SHOPPING
('Shopping', 'CLOTHING', 'USD', 0.012, 'EPA', '2024-01-01'),
('Shopping', 'ELECTRONICS', 'USD', 0.015, 'EPA', '2024-01-01'),
('Shopping', 'FURNITURE', 'USD', 0.010, 'EPA', '2024-01-01'),
('Shopping', 'BOOKS', 'USD', 0.005, 'EPA', '2024-01-01'),
('Shopping', 'CLOTHING', 'EUR', 0.013, 'EPA', '2024-01-01'),
('Shopping', 'ELECTRONICS', 'EUR', 0.016, 'EPA', '2024-01-01'),
('Shopping', 'FURNITURE', 'EUR', 0.011, 'EPA', '2024-01-01'),
('Shopping', 'BOOKS', 'EUR', 0.006, 'EPA', '2024-01-01');