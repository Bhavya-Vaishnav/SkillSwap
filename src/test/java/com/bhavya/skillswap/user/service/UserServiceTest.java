package com.bhavya.skillswap.user.service;

import com.bhavya.skillswap.common.ai.UserEmbeddingService;
import com.bhavya.skillswap.common.exception.ResourceNotFoundException;
import com.bhavya.skillswap.user.entity.User;
import com.bhavya.skillswap.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private UserEmbeddingService userEmbeddingService;

    @InjectMocks
    private UserService userService;

    @Test
    void updateBio_success_savesAndIndexes() {
        UUID userId = UUID.randomUUID();
        User user = new User("test@test.com", "hash", "Test");
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        userService.updateBio(userId, "I love backend dev");

        verify(userRepository).save(user);
        verify(userEmbeddingService).indexUserBio(userId, "I love backend dev");
        assertThat(user.getBio()).isEqualTo("I love backend dev");
    }

    @Test
    void updateBio_userNotFound_throwsException() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateBio(userId, "bio"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userEmbeddingService, never()).indexUserBio(any(), anyString());
    }

    @Test
    void searchUsers_returnsMatchResponses() {
        UUID requesterId = UUID.randomUUID();

        Document doc = mock(Document.class);

        when(doc.getMetadata()).thenReturn(
                Map.of("userId", "abc-123")
        );

        when(doc.getScore()).thenReturn(0.7);

        when(userEmbeddingService.findSimilarUsers("backend", requesterId, 5))
                .thenReturn(List.of(doc));

        var results = userService.searchUsers(requesterId, "backend", 5);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).userId()).isEqualTo("abc-123");
        assertThat(results.get(0).score()).isEqualTo(0.7);
    }
}