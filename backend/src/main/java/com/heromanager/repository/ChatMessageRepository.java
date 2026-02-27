package com.heromanager.repository;

import com.heromanager.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop100ByReceiverIdIsNullOrderByCreatedAtDesc();

    @Query("SELECT m FROM ChatMessage m WHERE m.receiverId IS NULL AND m.id > :since ORDER BY m.createdAt ASC")
    List<ChatMessage> findGeneralSince(@Param("since") Long since);

    @Query("SELECT m FROM ChatMessage m WHERE m.receiverId IS NOT NULL AND ((m.senderId=:a AND m.receiverId=:b) OR (m.senderId=:b AND m.receiverId=:a)) AND m.id > :since ORDER BY m.createdAt ASC")
    List<ChatMessage> findWhisperSince(@Param("a") Long a, @Param("b") Long b, @Param("since") Long since);

    @Query("SELECT DISTINCT CASE WHEN m.senderId=:pid THEN m.receiverId ELSE m.senderId END FROM ChatMessage m WHERE m.receiverId IS NOT NULL AND (m.senderId=:pid OR m.receiverId=:pid)")
    List<Long> findConversationPartnerIds(@Param("pid") Long playerId);
}
