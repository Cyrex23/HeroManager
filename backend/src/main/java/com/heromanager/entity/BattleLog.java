package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "battle_log")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
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
    private Integer challengerGoldEarned;

    @Column(nullable = false)
    private Integer defenderGoldEarned;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String battleLogJson;

    @Column(nullable = false)
    private Integer energyCost;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isReturnChallenge = false;

    @Column(nullable = false)
    @Builder.Default
    private Boolean returnChallengeUsed = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
