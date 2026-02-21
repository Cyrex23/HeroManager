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
    private int arenaEnergy = 120;

    @Column(nullable = false)
    private int worldEnergy = 120;

    @Column(nullable = false)
    private LocalDateTime lastEnergyUpdate;

    private LocalDateTime onlineUntil;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String profileImagePath;

    @Column(length = 30)
    private String teamName;

    private LocalDateTime teamNameLastChanged;

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
