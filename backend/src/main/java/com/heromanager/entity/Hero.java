package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "hero", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playerId", "templateId"})
})
@Getter
@Setter
@NoArgsConstructor
public class Hero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private Long templateId;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int currentXp = 0;

    @Column(columnDefinition = "int default 0")
    private int clashesWon = 0;

    @Column(columnDefinition = "int default 0")
    private int clashesLost = 0;

    @Column(columnDefinition = "int default 0")
    private int currentWinStreak = 0;

    @Column(columnDefinition = "int default 0")
    private int currentLossStreak = 0;

    @Column(columnDefinition = "double default 0")
    private double maxDamageDealt = 0;

    @Column(columnDefinition = "double default 0")
    private double maxDamageReceived = 0;

    @Column(columnDefinition = "int default 0")
    private int statPurchaseCount = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusPa = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusMp = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusDex = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusElem = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusMana = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusStam = 0;

    // null = use template capacity; set = player has overridden it
    private Integer capacityOverride;

    @Column(nullable = false)
    private LocalDateTime acquiredAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "templateId", insertable = false, updatable = false)
    private HeroTemplate template;

    @PrePersist
    protected void onCreate() {
        acquiredAt = LocalDateTime.now();
    }
}
