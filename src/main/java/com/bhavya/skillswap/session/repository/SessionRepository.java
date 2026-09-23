package com.bhavya.skillswap.session.repository;

import com.bhavya.skillswap.session.entity.Session;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionRepository extends JpaRepository<Session, UUID> {

    List<Session> findByRequesterIdOrProviderIdOrderByCreatedAtDesc(UUID requesterId, UUID providerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Session s WHERE s.id = :id")
    Optional<Session> findByIdForUpdate(@Param("id") UUID id);

    @Query(value = """
            SELECT COUNT(*), AVG(s.credit_amount), MIN(s.credit_amount), MAX(s.credit_amount)
            FROM sessions s
            JOIN skills sk ON s.skill_id = sk.id
            WHERE LOWER(sk.name) = LOWER(:skillName)
            AND s.status = 'COMPLETED'
            """, nativeQuery = true)
    List<Object[]> getPricingStats(@Param("skillName") String skillName);
}