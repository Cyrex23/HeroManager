package com.heromanager.repository;

import com.heromanager.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndReceiverId(Long requesterId, Long receiverId);

    @Query("SELECT f FROM Friendship f WHERE (f.requesterId = :pid OR f.receiverId = :pid) AND f.status = com.heromanager.entity.FriendshipStatus.ACCEPTED")
    List<Friendship> findAcceptedByPlayer(@Param("pid") Long playerId);

    @Query("SELECT f FROM Friendship f WHERE f.receiverId = :pid AND f.status = com.heromanager.entity.FriendshipStatus.PENDING")
    List<Friendship> findPendingReceived(@Param("pid") Long playerId);

    @Query("SELECT f FROM Friendship f WHERE f.requesterId = :pid AND f.status = com.heromanager.entity.FriendshipStatus.PENDING")
    List<Friendship> findPendingSent(@Param("pid") Long playerId);

    @Query("SELECT f FROM Friendship f WHERE (f.requesterId = :pid AND f.receiverId = :oid) OR (f.requesterId = :oid AND f.receiverId = :pid)")
    Optional<Friendship> findBetween(@Param("pid") Long playerId, @Param("oid") Long otherId);
}
