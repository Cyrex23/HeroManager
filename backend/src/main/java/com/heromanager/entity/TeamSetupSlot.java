package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_setup_slot")
@Getter
@Setter
@NoArgsConstructor
public class TeamSetupSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setup_id", nullable = false)
    private Long setupId;

    @Column(name = "slot_number", nullable = false)
    private int slotNumber;

    @Column(name = "hero_id")
    private Long heroId;

    @Column(name = "summon_id")
    private Long summonId;
}
