package com.catalog.comicbook.security;

import java.util.List;

public record JwtPrincipal(String username, List<String> roles) {
}

