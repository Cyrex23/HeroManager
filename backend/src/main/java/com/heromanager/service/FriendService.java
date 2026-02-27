package com.heromanager.service;

import com.heromanager.dto.FriendResponse;
import com.heromanager.entity.Friendship;
import com.heromanager.entity.FriendshipStatus;
import com.heromanager.entity.Player;
import com.heromanager.repository.FriendshipRepository;
import com.heromanager.repository.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final PlayerRepository playerRepository;
    private final EnergyService energyService;

    public FriendService(FriendshipRepository friendshipRepository,
                         PlayerRepository playerRepository,
                         EnergyService energyService) {
        this.friendshipRepository = friendshipRepository;
        this.playerRepository = playerRepository;
        this.energyService = energyService;
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> listFriends(Long playerId) {
        List<FriendResponse> result = new ArrayList<>();

        for (Friendship f : friendshipRepository.findAcceptedByPlayer(playerId)) {
            Long friendId = f.getRequesterId().equals(playerId) ? f.getReceiverId() : f.getRequesterId();
            playerRepository.findById(friendId).ifPresent(p ->
                    result.add(toResponse(p, "ACCEPTED")));
        }
        for (Friendship f : friendshipRepository.findPendingReceived(playerId)) {
            playerRepository.findById(f.getRequesterId()).ifPresent(p ->
                    result.add(toResponse(p, "PENDING_RECEIVED")));
        }
        for (Friendship f : friendshipRepository.findPendingSent(playerId)) {
            playerRepository.findById(f.getReceiverId()).ifPresent(p ->
                    result.add(toResponse(p, "PENDING_SENT")));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> searchPlayers(Long currentPlayerId, String query) {
        if (query == null || query.isBlank()) return List.of();
        List<Player> matches = playerRepository.findByUsernameContainingIgnoreCase(query);
        List<FriendResponse> result = new ArrayList<>();
        for (Player p : matches) {
            if (p.getId().equals(currentPlayerId)) continue;
            String status = resolveStatus(currentPlayerId, p.getId());
            result.add(toResponse(p, status));
            if (result.size() >= 10) break;
        }
        return result;
    }

    @Transactional
    public void sendRequest(Long requesterId, Long receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new FriendException("INVALID", "Cannot add yourself.");
        }
        if (!playerRepository.existsById(receiverId)) {
            throw new FriendException("NOT_FOUND", "Player not found.");
        }
        Optional<Friendship> existing = friendshipRepository.findBetween(requesterId, receiverId);
        if (existing.isPresent()) {
            throw new FriendException("ALREADY_EXISTS", "Friendship or request already exists.");
        }
        Friendship f = new Friendship();
        f.setRequesterId(requesterId);
        f.setReceiverId(receiverId);
        f.setStatus(FriendshipStatus.PENDING);
        friendshipRepository.save(f);
    }

    @Transactional
    public void acceptRequest(Long receiverId, Long requesterId) {
        Friendship f = friendshipRepository.findByRequesterIdAndReceiverId(requesterId, receiverId)
                .orElseThrow(() -> new FriendException("NOT_FOUND", "Friend request not found."));
        if (f.getStatus() != FriendshipStatus.PENDING) {
            throw new FriendException("INVALID", "Request is not pending.");
        }
        f.setStatus(FriendshipStatus.ACCEPTED);
        friendshipRepository.save(f);
    }

    @Transactional
    public void declineOrDelete(Long playerId, Long otherId) {
        Friendship f = friendshipRepository.findBetween(playerId, otherId)
                .orElseThrow(() -> new FriendException("NOT_FOUND", "Friendship not found."));
        friendshipRepository.delete(f);
    }

    private String resolveStatus(Long currentPlayerId, Long otherId) {
        Optional<Friendship> f = friendshipRepository.findBetween(currentPlayerId, otherId);
        if (f.isEmpty()) return "NONE";
        Friendship friendship = f.get();
        if (friendship.getStatus() == FriendshipStatus.ACCEPTED) return "ACCEPTED";
        if (friendship.getRequesterId().equals(currentPlayerId)) return "PENDING_SENT";
        return "PENDING_RECEIVED";
    }

    private FriendResponse toResponse(Player p, String status) {
        return FriendResponse.builder()
                .playerId(p.getId())
                .username(p.getUsername())
                .teamName(p.getTeamName() != null ? p.getTeamName() : p.getUsername())
                .profileImagePath(p.getProfileImagePath())
                .isOnline(energyService.isOnline(p))
                .relationStatus(status)
                .build();
    }

    public static class FriendException extends RuntimeException {
        private final String errorCode;
        public FriendException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return errorCode; }
    }
}
