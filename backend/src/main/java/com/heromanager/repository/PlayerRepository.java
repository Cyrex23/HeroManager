package com.heromanager.repository;

import com.heromanager.entity.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    Optional<Player> findByEmail(String email);
    Optional<Player> findByUsername(String username);
    Optional<Player> findByEmailOrUsername(String email, String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    List<Player> findByUsernameContainingIgnoreCase(String query);

    @Query("SELECT COUNT(p) FROM Player p WHERE p.onlineUntil > :now")
    long countOnlinePlayers(@Param("now") LocalDateTime now);
}
