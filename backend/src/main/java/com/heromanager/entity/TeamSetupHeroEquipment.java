package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "team_setup_hero_equipment")
@Getter
@Setter
@NoArgsConstructor
public class TeamSetupHeroEquipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setup_id", nullable = false)
    private Long setupId;

    @Column(name = "hero_id", nullable = false)
    private Long heroId;

    @Column(name = "slot_number", nullable = false)
    private int slotNumber;

    @Column(name = "item_template_id")
    private Long itemTemplateId;

    @Column(name = "ability_template_id")
    private Long abilityTemplateId;
}
