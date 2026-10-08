@echo off
color 0A
echo ============================================================
echo 🌿 CARBON FOOTPRINT TRACKER - SETUP STARTING...
echo ============================================================
echo.

echo 📦 Creating Backend Folders...
mkdir backend\src\main\java\com\ecotrack\carbon\config 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\controller 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\dto\request 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\dto\response 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\entity 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\entity\enums 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\exception 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\repository 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\security 2>nul
mkdir backend\src\main\java\com\ecotrack\carbon\service 2>nul
mkdir backend\src\main\resources 2>nul
echo ✅ Backend folders created!

echo.
echo ⚛️ Creating Frontend Folders...
mkdir reactfrontend\src\api 2>nul
mkdir reactfrontend\src\components\auth 2>nul
mkdir reactfrontend\src\components\common 2>nul
mkdir reactfrontend\src\components\dashboard 2>nul
mkdir reactfrontend\src\components\activities 2>nul
mkdir reactfrontend\src\components\analytics 2>nul
mkdir reactfrontend\src\components\goals 2>nul
mkdir reactfrontend\src\components\leaderboard 2>nul
mkdir reactfrontend\src\components\profile 2>nul
mkdir reactfrontend\src\components\admin 2>nul
mkdir reactfrontend\src\components\ui 2>nul
mkdir reactfrontend\src\contexts 2>nul
mkdir reactfrontend\src\hooks 2>nul
mkdir reactfrontend\src\utils 2>nul
mkdir reactfrontend\src\styles 2>nul
mkdir reactfrontend\src\lib 2>nul
mkdir reactfrontend\public 2>nul
echo ✅ Frontend folders created!

echo.
echo 📝 Creating Backend Files...

:: Create pom.xml
(
echo ^<?xml version="1.0" encoding="UTF-8"?^>
echo ^<project xmlns="http://maven.apache.org/POM/4.0.0"^>
echo     ^<modelVersion^>4.0.0^</modelVersion^>
echo     ^<parent^>
echo         ^<groupId^>org.springframework.boot^</groupId^>
echo         ^<artifactId^>spring-boot-starter-parent^</artifactId^>
echo         ^<version^>3.3.2^</version^>
echo     ^</parent^>
echo     ^<groupId^>com.ecotrack^</groupId^>
echo     ^<artifactId^>carbon-footprint-backend^</artifactId^>
echo     ^<version^>1.0.0^</version^>
echo     ^<properties^>
echo         ^<java.version^>17^</java.version^>
echo     ^</properties^>
echo     ^<dependencies^>
echo         ^<dependency^>
echo             ^<groupId^>org.springframework.boot^</groupId^>
echo             ^<artifactId^>spring-boot-starter-web^</artifactId^>
echo         ^</dependency^>
echo         ^<dependency^>
echo             ^<groupId^>org.springframework.boot^</groupId^>
echo             ^<artifactId^>spring-boot-starter-data-jpa^</artifactId^>
echo         ^</dependency^>
echo         ^<dependency^>
echo             ^<groupId^>com.mysql^</groupId^>
echo             ^<artifactId^>mysql-connector-j^</artifactId^>
echo             ^<scope^>runtime^</scope^>
echo         ^</dependency^>
echo         ^<dependency^>
echo             ^<groupId^>org.projectlombok^</groupId^>
echo             ^<artifactId^>lombok^</artifactId^>
echo             ^<optional^>true^</optional^>
echo         ^</dependency^>
echo     ^</dependencies^>
echo ^</project^>
) > backend\pom.xml
echo ✅ pom.xml created!

:: Create application.properties
(
echo server.port=8080
echo spring.datasource.url=jdbc:mysql://localhost:3306/carbon_footprint_dev
echo spring.datasource.username=root
echo spring.datasource.password=rootpassword
echo spring.jpa.hibernate.ddl-auto=update
echo spring.jpa.show-sql=true
) > backend\src\main\resources\application.properties
echo ✅ application.properties created!

:: Create main application
(
echo package com.ecotrack.carbon;
echo import org.springframework.boot.SpringApplication;
echo import org.springframework.boot.autoconfigure.SpringBootApplication;
echo @SpringBootApplication
echo public class CarbonFootprintApplication {
echo     public static void main(String[] args) {
echo         SpringApplication.run(CarbonFootprintApplication.class, args);
echo     }
echo }
) > backend\src\main\java\com\ecotrack\carbon\CarbonFootprintApplication.java
echo ✅ CarbonFootprintApplication.java created!

:: Create User entity
(
echo package com.ecotrack.carbon.entity;
echo import jakarta.persistence.*;
echo import lombok.*;
echo import java.time.LocalDateTime;
echo @Entity
echo @Table(name = "users")
echo @Data
echo @NoArgsConstructor
echo @AllArgsConstructor
echo @Builder
echo public class User {
echo     @Id
echo     @GeneratedValue(strategy = GenerationType.IDENTITY)
echo     private Long id;
echo     @Column(unique = true, nullable = false)
echo     private String email;
echo     @Column(nullable = false)
echo     private String passwordHash;
echo     @Column(nullable = false)
echo     private String fullName;
echo     @Column(nullable = false)
echo     private String role = "USER";
echo     @Column(nullable = false)
echo     private boolean enabled = true;
echo     @Column(updatable = false)
echo     private LocalDateTime createdAt;
echo }
) > backend\src\main\java\com\ecotrack\carbon\entity\User.java
echo ✅ User.java created!

:: Create UserRepository
(
echo package com.ecotrack.carbon.repository;
echo import com.ecotrack.carbon.entity.User;
echo import org.springframework.data.jpa.repository.JpaRepository;
echo import java.util.Optional;
echo public interface UserRepository extends JpaRepository^<User, Long^> {
echo     Optional^<User^> findByEmail(String email);
echo     boolean existsByEmail(String email);
echo }
) > backend\src\main\java\com\ecotrack\carbon\repository\UserRepository.java
echo ✅ UserRepository.java created!

:: Create SecurityConfig
(
echo package com.ecotrack.carbon.config;
echo import org.springframework.context.annotation.Bean;
echo import org.springframework.context.annotation.Configuration;
echo import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
echo import org.springframework.security.crypto.password.PasswordEncoder;
echo @Configuration
echo public class SecurityConfig {
echo     @Bean
echo     public PasswordEncoder passwordEncoder() {
echo         return new BCryptPasswordEncoder();
echo     }
echo }
) > backend\src\main\java\com\ecotrack\carbon\config\SecurityConfig.java
echo ✅ SecurityConfig.java created!

:: Create AuthController
(
echo package com.ecotrack.carbon.controller;
echo import com.ecotrack.carbon.entity.User;
echo import com.ecotrack.carbon.repository.UserRepository;
echo import lombok.RequiredArgsConstructor;
echo import org.springframework.security.crypto.password.PasswordEncoder;
echo import org.springframework.web.bind.annotation.*;
echo import java.time.LocalDateTime;
echo import java.util.HashMap;
echo import java.util.Map;
echo @RestController
echo @RequestMapping("/api/auth")
echo @RequiredArgsConstructor
echo public class AuthController {
echo     private final UserRepository userRepository;
echo     private final PasswordEncoder passwordEncoder;
echo     @PostMapping("/register")
echo     public Map^<String, String^> register(@RequestBody Map^<String, String^> request) {
echo         String email = request.get("email");
echo         String password = request.get("password");
echo         String fullName = request.get("fullName");
echo         if (userRepository.existsByEmail(email)) {
echo             Map^<String, String^> response = new HashMap^<^>();
echo             response.put("error", "Email already exists");
echo             return response;
echo         }
echo         User user = User.builder()
echo             .email(email)
echo             .passwordHash(passwordEncoder.encode(password))
echo             .fullName(fullName)
echo             .createdAt(LocalDateTime.now())
echo             .build();
echo         userRepository.save(user);
echo         Map^<String, String^> response = new HashMap^<^>();
echo         response.put("message", "User registered successfully");
echo         return response;
echo     }
echo     @PostMapping("/login")
echo     public Map^<String, String^> login(@RequestBody Map^<String, String^> request) {
echo         Map^<String, String^> response = new HashMap^<^>();
echo         response.put("message", "Login successful");
echo         response.put("token", "demo-jwt-token");
echo         return response;
echo     }
echo }
) > backend\src\main\java\com\ecotrack\carbon\controller\AuthController.java
echo ✅ AuthController.java created!

echo.
echo ✅ Backend files complete!

echo.
echo ⚛️ Creating Frontend Files...

:: Create package.json
(
echo {
echo   "name": "carbon-footprint-frontend",
echo   "version": "1.0.0",
echo   "type": "module",
echo   "scripts": {
echo     "dev": "vite",
echo     "build": "vite build",
echo     "preview": "vite preview"
echo   },
echo   "dependencies": {
echo     "react": "^18.2.0",
echo     "react-dom": "^18.2.0",
echo     "axios": "^1.6.0"
echo   },
echo   "devDependencies": {
echo     "@vitejs/plugin-react": "^4.2.0",
echo     "vite": "^5.0.0"
echo   }
echo }
) > reactfrontend\package.json
echo ✅ package.json created!

:: Create index.html
(
echo ^<!DOCTYPE html^>
echo ^<html^>
echo   ^<head^>
echo     ^<meta charset="UTF-8" /^>
echo     ^<title^>Carbon Footprint Tracker^</title^>
echo   ^</head^>
echo   ^<body^>
echo     ^<div id="root"^>^</div^>
echo     ^<script type="module" src="/src/main.jsx"^>^</script^>
echo   ^</body^>
echo ^</html^>
) > reactfrontend\index.html
echo ✅ index.html created!

:: Create main.jsx
(
echo import React from 'react';
echo import ReactDOM from 'react-dom/client';
echo import App from './App';
echo ReactDOM.createRoot(document.getElementById('root')).render(
echo   ^<React.StrictMode^>
echo     ^<App /^>
echo   ^</React.StrictMode^>
echo );
) > reactfrontend\src\main.jsx
echo ✅ main.jsx created!

:: Create App.jsx
(
echo import React, { useState } from 'react';
echo import axios from 'axios';
echo function App() {
echo   const [email, setEmail] = useState('');
echo   const [password, setPassword] = useState('');
echo   const [message, setMessage] = useState('');
echo   const handleSubmit = async (e) => {
echo     e.preventDefault();
echo     try {
echo       const response = await axios.post('/api/auth/login', { email, password });
echo       setMessage(response.data.message ^|^| 'Success!');
echo     } catch (error) {
echo       setMessage(error.response?.data?.error ^|^| 'Error');
echo     }
echo   };
echo   return (
echo     ^<div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', fontFamily: 'Arial' }}^>
echo       ^<h1^>🌿 Carbon Footprint Tracker^</h1^>
echo       ^<h2^>Login^</h2^>
echo       ^<form onSubmit={handleSubmit}^>
echo         ^<div^>
echo           ^<label^>Email:^</label^>
echo           ^<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /^>
echo         ^</div^>
echo         ^<div^>
echo           ^<label^>Password:^</label^>
echo           ^<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /^>
echo         ^</div^>
echo         ^<button type="submit"^>Login^</button^>
echo       ^</form^>
echo       {message ^&^& ^<p^>{message}^</p^>}
echo     ^</div^>
echo   );
echo }
echo export default App;
) > reactfrontend\src\App.jsx
echo ✅ App.jsx created!

:: Create vite.config.js
(
echo import { defineConfig } from 'vite';
echo import react from '@vitejs/plugin-react';
echo export default defineConfig({
echo   plugins: [react()],
echo   server: {
echo     port: 3000,
echo     proxy: {
echo       '/api': {
echo         target: 'http://localhost:8080',
echo         changeOrigin: true,
echo       },
echo     },
echo   },
echo });
) > reactfrontend\vite.config.js
echo ✅ vite.config.js created!

echo.
echo ✅ Frontend files complete!

echo.
echo 📦 Installing Dependencies...
echo This may take a few minutes...

cd reactfrontend
call npm install --legacy-peer-deps

cd ..

echo.
echo ============================================================
echo 🎉 SETUP COMPLETE!
echo ============================================================
echo.
echo NEXT STEPS:
echo ============================================================
echo 1. Create MySQL Database:
echo    mysql -u root -p
echo    CREATE DATABASE carbon_footprint_dev;
echo.
echo 2. Start Backend:
echo    cd backend
echo    mvn spring-boot:run
echo.
echo 3. Start Frontend:
echo    cd reactfrontend
echo    npm run dev
echo.
echo 4. Open browser: http://localhost:3000
echo ============================================================
pause   