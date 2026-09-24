package com.bhavya.skillswap.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * Shared JSON serializer for both the RedisTemplate and the cache manager.
     * Single source of truth — values written via template and read via @Cacheable
     * (or vice versa) are always compatible.
     */
    @Bean
    public GenericJacksonJsonRedisSerializer redisJsonSerializer() {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(Object.class)
                .build();

        return GenericJacksonJsonRedisSerializer.builder()
                .enableDefaultTyping(ptv)
                .enableSpringCacheNullValueSupport()
                .customize(builder -> builder.findAndAddModules())
                .build();
    }

    /**
     * RedisTemplate for direct operations (sessions, tokens, manual cache writes).
     * String keys, JSON values — readable via redis-cli, no JDK binary blobs.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory,
            GenericJacksonJsonRedisSerializer redisJsonSerializer) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(redisJsonSerializer);
        template.setHashValueSerializer(redisJsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    /**
     * Cache manager backing @Cacheable / @CacheEvict annotations,
     * with per-cache TTL policies.
     */
    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            GenericJacksonJsonRedisSerializer redisJsonSerializer) {

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(redisJsonSerializer));

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("skillsCatalog", defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigs.put("pricingStats", defaultConfig.entryTtl(Duration.ofHours(2)));
        cacheConfigs.put("parsedBio", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigs.put("userProfiles", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("userSkills", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("userSessions", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}