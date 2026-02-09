package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "team_slot")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TeamSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private Integer slotNumber;

    private Long heroId;

    private Long summonId;
}
