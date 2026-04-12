package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import java.util.Optional;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private UserRepository userRepository;

    // Pulls the URL from application.properties (Vercel URL in prod, localhost in
    // dev)
    @Value("${frontend.url}")
    private String frontendUrl;

    // --- 1. THE GATEKEEPER LIST ---
    private final List<String> ALLOWED_EMAILS = List.of(
            "musharafshaik2004@gmail.com",
            "1011musharaf@gmail.com",
            "munna1110004@gmail.com");

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                // --- 2. PERMISSIONS ---
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/").permitAll()
                        .anyRequest().authenticated())

                // --- 3. GOOGLE LOGIN ---
                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                            String email = oAuth2User.getAttribute("email");
                            String name = oAuth2User.getAttribute("name");
                            String googleId = oAuth2User.getAttribute("sub");

                            logger.info(">>> [AUTH] Google Auth Success for: {}", email);

                            // --- STEP 1: WHITELIST CHECK ---
                            if (!ALLOWED_EMAILS.contains(email)) {
                                logger.warn(">>> [SECURITY] Blocked unauthorized email attempt: {}", email);
                                request.getSession().invalidate();
                                response.sendRedirect(frontendUrl + "/unauthorized");
                                return;
                            }

                            // --- STEP 2: DATABASE SYNC & SMART REDIRECT ---
                            try {
                                Optional<User> existingUserOpt = userRepository.findByEmail(email);

                                if (existingUserOpt.isEmpty()) {
                                    logger.info(">>> [DATABASE] New Account! Initializing with 50 points...");
                                    User newUser = new User();
                                    newUser.setEmail(email);
                                    newUser.setName(name);
                                    newUser.setGoogleId(googleId);
                                    newUser.setPoints(50);
                                    newUser.setGender("Pending");

                                    java.util.Random random = new java.util.Random();
                                    Long generatedId;

                                    do {
                                        generatedId = (long) (10000 + random.nextInt(90000));
                                    } while (userRepository.existsById(generatedId));

                                    newUser.setId(generatedId);
                                    userRepository.save(newUser);

                                    response.sendRedirect(frontendUrl + "/setup");
                                } else {
                                    User existingUser = existingUserOpt.get();
                                    logger.info(">>> [DATABASE] Returning User: {}", existingUser.getName());

                                    if (existingUser.getGender() == null
                                            || existingUser.getGender().equals("Pending")) {
                                        response.sendRedirect(frontendUrl + "/setup");
                                    } else {
                                        response.sendRedirect(frontendUrl + "/dashboard");
                                    }
                                }
                            } catch (Exception e) {
                                logger.error(">>> [ERROR] Auth Logic Failure: {}", e.getMessage(), e);
                                response.sendRedirect(frontendUrl + "/error");
                            }
                        }))

                // --- 4. LOGOUT ---
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl(frontendUrl + "/")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .permitAll());

        return http.build();
    }

    // --- 5. CORS CONFIGURATION ---

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Use your specific Vercel URL (NO trailing slash)
        configuration.setAllowedOrigins(Arrays.asList("https://campus-express-three.vercel.app"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        // THIS IS THE KEY:
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}