package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "equipped_ability")
@Getter
@Setter
@NoArgsConstructor
public class EquippedAbility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private Long playerId;

    @Column
    private Long heroId;

    @Column(nullable = false)
    private Long abilityTemplateId;

    @Column
    private Integer slotNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abilityTemplateId", insertable = false, updatable = false)
    private AbilityTemplate abilityTemplate;
}
