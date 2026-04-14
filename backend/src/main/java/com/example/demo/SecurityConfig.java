package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Optional;
import java.util.Arrays;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil; // NEW

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter; // NEW

    @Value("${frontend.url}")
    private String frontendUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                // NEW: SWITCH TO STATELESS FOR iPHONE SUPPORT
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login/**", "/oauth2/**", "/api/user/active-count", "/auth-success")
                        .permitAll()
                        .anyRequest().authenticated())

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                        }))

                .oauth2Login(oauth2 -> oauth2
                        .successHandler((request, response, authentication) -> {
                            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
                            String email = oAuth2User.getAttribute("email");
                            String name = oAuth2User.getAttribute("name");
                            String googleId = oAuth2User.getAttribute("sub");

                            logger.info(">>> [AUTH] Google Login Success for: {}", email);

                            try {
                                Optional<User> existingUserOpt = userRepository.findByEmail(email);
                                String targetPath = "/dashboard"; // Default

                                if (existingUserOpt.isEmpty()) {
                                    logger.info(">>> [DATABASE] Creating new account for: {}", email);
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
                                    targetPath = "/setup";
                                } else {
                                    User existingUser = existingUserOpt.get();
                                    if (existingUser.getGender() == null
                                            || existingUser.getGender().equals("Pending")) {
                                        targetPath = "/setup";
                                    }
                                }

                                // NEW: GENERATE THE TOKEN
                                String token = jwtUtil.generateToken(email);

                                // NEW: REDIRECT TO SAVE TOKEN, THEN GO TO TARGET PATH
                                response.sendRedirect(
                                        frontendUrl + "/auth-success?token=" + token + "&redirect=" + targetPath);

                            } catch (Exception e) {
                                logger.error(">>> [ERROR] Auth Sync Failure: {}", e.getMessage());
                                response.sendRedirect(frontendUrl + "/error");
                            }
                        }))
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl(frontendUrl + "/")
                        .permitAll());

        // NEW: ADD THE JWT BOUNCER
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // CORS origin is controlled by the FRONTEND_URL environment variable in Render.
        // Set FRONTEND_URL=https://campus-express-three.vercel.app in Render dashboard.
        configuration.setAllowedOrigins(Arrays.asList(frontendUrl));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cookie", "X-Requested-With"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}