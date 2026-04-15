package com.catalog.comicbook.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Map;

@RestController
@RequestMapping("/cloudinary")
public class CloudinaryController {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryController(
            @Value("${CLOUDINARY_CLOUD_NAME:}") String cloudName,
            @Value("${CLOUDINARY_API_KEY:}") String apiKey,
            @Value("${CLOUDINARY_API_SECRET:}") String apiSecret
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    public record CloudinarySignatureResponse(
            String cloudName,
            String apiKey,
            long timestamp,
            String folder,
            String signature
    ) {}

    @GetMapping("/signature")
    public ResponseEntity<?> signature(@RequestParam(defaultValue = "comics") String folder) {
        if (cloudName.isBlank() || apiKey.isBlank() || apiSecret.isBlank()) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Cloudinary env vars missing",
                    "required", "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
            ));
        }

        long timestamp = Instant.now().getEpochSecond();

        // Cloudinary signature: sha1 of "folder=<folder>&timestamp=<ts><api_secret>"
        // Only include parameters you are sending to Cloudinary.
        String toSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
        String signature = sha1Hex(toSign);

        return ResponseEntity.ok(new CloudinarySignatureResponse(
                cloudName,
                apiKey,
                timestamp,
                folder,
                signature
        ));
    }

    private static String sha1Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("Unable to compute SHA-1", e);
        }
    }
}

