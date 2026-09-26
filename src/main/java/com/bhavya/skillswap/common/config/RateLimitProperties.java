package com.bhavya.skillswap.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@ConfigurationProperties(prefix = "rate-limit")
@Component
@Getter
@Setter
public class RateLimitProperties {
    private int capacity;
    private int refillTokens;
    private int refillSeconds;
}