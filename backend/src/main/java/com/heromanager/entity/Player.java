package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "player")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(unique = true, nullable = false, length = 30)
    private String username;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    @Builder.Default
    private Boolean emailConfirmed = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer gold = 500;

    @Column(nullable = false)
    @Builder.Default
    private Integer diamonds = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer arenaEnergy = 120;

    @Column(nullable = false)
    @Builder.Default
    private Integer worldEnergy = 120;

    @Column(nullable = false)
    private LocalDateTime lastEnergyUpdate;

    private LocalDateTime onlineUntil;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (lastEnergyUpdate == null) {
            lastEnergyUpdate = LocalDateTime.now();
        }
    }
}
