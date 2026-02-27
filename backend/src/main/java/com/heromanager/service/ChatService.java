package com.heromanager.service;

import com.heromanager.dto.ChatMessageResponse;
import com.heromanager.entity.ChatMessage;
import com.heromanager.entity.Player;
import com.heromanager.repository.ChatMessageRepository;
import com.heromanager.repository.PlayerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final PlayerRepository playerRepository;
    private final EnergyService energyService;

    private static final int MAX_CONTENT_LENGTH = 500;
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public ChatService(ChatMessageRepository chatMessageRepository,
                       PlayerRepository playerRepository,
                       EnergyService energyService) {
        this.chatMessageRepository = chatMessageRepository;
        this.playerRepository = playerRepository;
        this.energyService = energyService;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getGeneralMessages(Long playerId, Long sinceId) {
        List<ChatMessage> msgs;
        if (sinceId == null || sinceId <= 0) {
            msgs = chatMessageRepository.findTop100ByReceiverIdIsNullOrderByCreatedAtDesc();
            Collections.reverse(msgs);
        } else {
            msgs = chatMessageRepository.findGeneralSince(sinceId);
        }
        return msgs.stream().map(m -> toDto(m, playerId)).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendGeneral(Long senderId, String content) {
        validateContent(content);
        Player sender = playerRepository.findById(senderId)
                .orElseThrow(() -> new ChatException("PLAYER_NOT_FOUND", "Player not found."));
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setSenderUsername(sender.getUsername());
        msg.setContent(content.trim());
        msg = chatMessageRepository.save(msg);
        return toDto(msg, senderId);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getWhisperMessages(Long playerId, Long otherId, Long sinceId) {
        long since = (sinceId == null || sinceId <= 0) ? 0L : sinceId;
        List<ChatMessage> msgs = chatMessageRepository.findWhisperSince(playerId, otherId, since);
        return msgs.stream().map(m -> toDto(m, playerId)).collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageResponse sendWhisper(Long senderId, Long receiverId, String content) {
        validateContent(content);
        Player sender = playerRepository.findById(senderId)
                .orElseThrow(() -> new ChatException("PLAYER_NOT_FOUND", "Player not found."));
        ChatMessage msg = new ChatMessage();
        msg.setSenderId(senderId);
        msg.setSenderUsername(sender.getUsername());
        msg.setReceiverId(receiverId);
        msg.setContent(content.trim());
        msg = chatMessageRepository.save(msg);
        return toDto(msg, senderId);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getConversations(Long playerId) {
        List<Long> partnerIds = chatMessageRepository.findConversationPartnerIds(playerId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Long partnerId : partnerIds) {
            playerRepository.findById(partnerId).ifPresent(p -> {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("playerId", p.getId());
                entry.put("username", p.getUsername());
                entry.put("profileImagePath", p.getProfileImagePath());
                entry.put("isOnline", energyService.isOnline(p));
                result.add(entry);
            });
        }
        return result;
    }

    private void validateContent(String content) {
        if (content == null || content.isBlank()) {
            throw new ChatException("EMPTY_MESSAGE", "Message cannot be empty.");
        }
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new ChatException("MESSAGE_TOO_LONG", "Message cannot exceed " + MAX_CONTENT_LENGTH + " characters.");
        }
    }

    private ChatMessageResponse toDto(ChatMessage m, Long currentPlayerId) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .senderId(m.getSenderId())
                .senderUsername(m.getSenderUsername())
                .content(m.getContent())
                .createdAt(m.getCreatedAt().format(ISO))
                .isOwn(m.getSenderId().equals(currentPlayerId))
                .receiverId(m.getReceiverId())
                .build();
    }

    public static class ChatException extends RuntimeException {
        private final String errorCode;
        public ChatException(String errorCode, String message) {
            super(message);
            this.errorCode = errorCode;
        }
        public String getErrorCode() { return errorCode; }
    }
}
