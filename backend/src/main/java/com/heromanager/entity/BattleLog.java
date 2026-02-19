package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "battle_log")
@Getter
@Setter
@NoArgsConstructor
public class BattleLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long challengerId;

    @Column(nullable = false)
    private Long defenderId;

    @Column(nullable = false)
    private Long winnerId;

    @Column(nullable = false)
    private int challengerGoldEarned;

    @Column(nullable = false)
    private int defenderGoldEarned;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String battleLog;

    @Column(nullable = false)
    private int energyCost;

    @Column(nullable = false)
    private boolean isReturnChallenge = false;

    @Column(nullable = false)
    private boolean returnChallengeUsed = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
