package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "player")
@Getter
@Setter
@NoArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, unique = true, length = 30)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private boolean emailConfirmed = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean banned = false;

    @Column(nullable = false)
    private int gold = 500;

    @Column(nullable = false)
    private int diamonds = 0;

    @Column(nullable = false)
    private double arenaEnergy = 120.0;

    @Column(nullable = false)
    private double worldEnergy = 120.0;

    @Column(nullable = false)
    private LocalDateTime lastEnergyUpdate;

    private LocalDateTime onlineUntil;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String profileImagePath;

    @Column(length = 30)
    private String teamName;

    private LocalDateTime teamNameLastChanged;

    @Column(nullable = false)
    private boolean chatSoundEnabled = true;

    // ── Upgrades ──────────────────────────────────────────────────────────────
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean extraLineupGoldPurchased = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean extraLineupDiamondsPurchased = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean energyPlusPurchased = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean heroPlusCapacityPurchased = false;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int capacityPlusCount = 0;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean statResetUnlocked = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean extraCraftingSlotPurchased = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean doubleSpinPurchased = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean battleLogUnlocked = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean returnCapUpgraded = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean challengeLimitUpgraded = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean energyGainUpgraded = false;

    @Column(nullable = false)
    private int currentWinStreak = 0;
    @Column(nullable = false)
    private int currentLossStreak = 0;
    @Column(nullable = false)
    private int bestWinStreak = 0;
    @Column(nullable = false)
    private int bestLossStreak = 0;

    private java.time.LocalDateTime lastBlacksmithSpin;
    private java.time.LocalDateTime lastBlacksmithSpin2;
    private Long pendingSpinMaterialId;
    private int pendingSpinQty;

    @ElementCollection
    @CollectionTable(name = "player_unlocked_avatars", joinColumns = @JoinColumn(name = "player_id"))
    @Column(name = "image_path")
    private Set<String> unlockedAvatars = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastEnergyUpdate = LocalDateTime.now();
    }
}
