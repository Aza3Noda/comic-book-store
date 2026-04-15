package com.catalog.comicbook.config;

import com.catalog.comicbook.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> {})
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public paths
                .requestMatchers(HttpMethod.GET, "/comics/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                // Admin helpers
                .requestMatchers("/cloudinary/**").hasRole("ADMIN")
                // Admin paths
                .requestMatchers(HttpMethod.POST, "/comics/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/comics/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/comics/**").hasRole("ADMIN")
                // Fallback
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder encoder,
            @Value("${ADMIN_USERNAME:admin}") String adminUsername,
            @Value("${ADMIN_PASSWORD_HASH:}") String adminPasswordHash,
            @Value("${ADMIN_PASSWORD:}") String adminPassword
    ) {
        String passwordToStore;
        if (adminPasswordHash != null && !adminPasswordHash.isBlank()) {
            passwordToStore = adminPasswordHash;
        } else if (adminPassword != null && !adminPassword.isBlank()) {
            passwordToStore = encoder.encode(adminPassword);
        } else {
            // Safe-ish default for local dev; MUST be overridden in production.
            passwordToStore = encoder.encode("change-me");
        }

        UserDetails admin = User.builder()
                .username(adminUsername)
                .password(passwordToStore)
                .roles("ADMIN")
                .build();

        return new InMemoryUserDetailsManager(admin);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Comma-separated list for production (e.g. https://your-app.vercel.app)
        String frontendOrigin = System.getenv().getOrDefault("FRONTEND_ORIGIN", "http://localhost:5173");
        configuration.setAllowedOrigins(
                List.of(frontendOrigin.split(",")).stream().map(String::trim).filter(s -> !s.isBlank()).toList()
        );
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
