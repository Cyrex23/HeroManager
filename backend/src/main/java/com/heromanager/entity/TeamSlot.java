package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_slot", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"playerId", "slotNumber"})
})
@Getter
@Setter
@NoArgsConstructor
public class TeamSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private int slotNumber;

    private Long heroId;

    private Long summonId;
}
