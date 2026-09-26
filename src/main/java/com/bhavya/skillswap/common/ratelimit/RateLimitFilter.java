package com.bhavya.skillswap.common.ratelimit;

import com.bhavya.skillswap.common.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain
    ) throws ServletException, IOException {
        log.info("RateLimitFilter hit: {}", request.getRequestURI());
        String path = request.getRequestURI();

        // Skip authentication endpoints
        if (path.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        // Skip requests without JWT
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        String userId = jwtUtil.extractUserId(token).toString();

        if (!rateLimiterService.tryConsume(userId)) {
            response.setStatus(429);
            response.setContentType("application/json");

            response.getWriter().write(
                    "{\"message\":\"Rate limit exceeded. Try again later.\"}"
            );

            return;
        }

        chain.doFilter(request, response);
    }
}