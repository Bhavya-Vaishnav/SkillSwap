package com.bhavya.skillswap.common.ratelimit;

import com.bhavya.skillswap.common.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.distributed.ExpirationAfterWriteStrategy;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RateLimiterService implements InitializingBean {

    private final LettuceConnectionFactory lettuceConnectionFactory;
    private final RateLimitProperties props;

    private LettuceBasedProxyManager<String> proxyManager;
    private BucketConfiguration bucketConfig;

    @Override
    public void afterPropertiesSet() {
        RedisClient redisClient = (RedisClient) lettuceConnectionFactory.getNativeClient();

        StatefulRedisConnection<String, byte[]> connection = redisClient.connect(
                RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE)
        );

        proxyManager = LettuceBasedProxyManager
                .builderFor(connection)
                .withExpirationStrategy(
                        ExpirationAfterWriteStrategy.basedOnTimeForRefillingBucketUpToMax(
                                Duration.ofSeconds(props.getRefillSeconds() * 2L)
                        )
                )
                .build();

        bucketConfig = BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(props.getCapacity())
                        .refillIntervally(props.getRefillTokens(),
                                Duration.ofSeconds(props.getRefillSeconds()))
                        .build())
                .build();

    }

    public boolean tryConsume(String userId) {
        Bucket bucket = proxyManager.builder()
                .build("rl:" + userId, () -> bucketConfig);

        boolean consumed = bucket.tryConsume(1);
        return consumed;
    }
}