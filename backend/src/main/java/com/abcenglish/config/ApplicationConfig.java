package com.abcenglish.config;

import com.abcenglish.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class ApplicationConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public ApplicationConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // PUBLIC endpoints - no authentication required
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                // Public course information (read-only)
                .requestMatchers(HttpMethod.GET, "/api/courses").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/courses/featured").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/courses/level/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/courses/{id}").permitAll()
                // Public vocabulary (read-only)
                .requestMatchers(HttpMethod.GET, "/api/vocabulary").permitAll()
                // Public leaderboard
                .requestMatchers("/api/ranking/**").permitAll()
                // Public gamification (read-only)
                .requestMatchers(HttpMethod.GET, "/api/gamification/badges").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/gamification/leaderboard").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/gamification/stats").permitAll()
                // Public forum (read-only)
                .requestMatchers(HttpMethod.GET, "/api/forum/posts").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/forum/posts/{id}").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/forum/posts/{id}/comments").permitAll()
                // Public AI chat
                .requestMatchers("/api/ai/chat").permitAll()
                // Public tests (read-only)
                .requestMatchers(HttpMethod.GET, "/api/tests").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/tests/{id}").permitAll()
                // Lesson management (read-only for public, write requires auth)
                .requestMatchers(HttpMethod.GET, "/api/lesson-management/lessons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/course-management/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/lesson-management/exercises/**").permitAll()
                // Actuator
                .requestMatchers("/actuator/health").permitAll()
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001"
        ));
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"
        ));
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept",
            "Origin",
            "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        configuration.setExposedHeaders(Arrays.asList(
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials",
            "Authorization"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
