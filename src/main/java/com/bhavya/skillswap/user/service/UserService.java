package com.bhavya.skillswap.user.service;

import com.bhavya.skillswap.common.ai.UserEmbeddingService;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.user.dto.UserMatchResponse;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserEmbeddingService userEmbeddingService;

    @Transactional
    public void updateBio(UUID userId, String bio) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        user.setBio(bio);
        userRepository.save(user);
        userEmbeddingService.indexUserBio(userId, bio);
    }

    public List<UserMatchResponse> searchUsers(UUID requesterId, String query, int topK) {
        return userEmbeddingService.findSimilarUsers(query, requesterId, topK).stream()
                .map(doc -> new UserMatchResponse(
                        (String) doc.getMetadata().get("userId"),
                        doc.getScore()))
                .toList();
    }
}