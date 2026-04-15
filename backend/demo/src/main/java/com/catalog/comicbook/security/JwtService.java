package com.catalog.comicbook.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    private final SecretKey key;
    private final String issuer;
    private final Duration expires;

    public JwtService(
            @Value("${JWT_SECRET}") String jwtSecret,
            @Value("${JWT_ISSUER:comicbook-store}") String issuer,
            @Value("${JWT_EXPIRES_MIN:120}") long expiresMin
    ) {
        // HS256 requires a sufficiently long secret; Keys.hmacShaKeyFor validates length.
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        this.issuer = issuer;
        this.expires = Duration.ofMinutes(expiresMin);
    }

    public String generateToken(UserDetails user) {
        Instant now = Instant.now();
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();

        return Jwts.builder()
                .setIssuer(issuer)
                .setSubject(user.getUsername())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plus(expires)))
                .claim("roles", roles)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public long expiresInSeconds() {
        return expires.toSeconds();
    }

    public JwtPrincipal parse(String token) {
        var claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String username = claims.getSubject();
        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);
        return new JwtPrincipal(username, roles == null ? List.of() : roles);
    }
}

