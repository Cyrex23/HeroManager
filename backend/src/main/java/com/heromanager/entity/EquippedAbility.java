package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "equipped_ability", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"heroId", "abilityTemplateId"})
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class EquippedAbility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long heroId;

    @Column(nullable = false)
    private Long abilityTemplateId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "abilityTemplateId", insertable = false, updatable = false)
    private AbilityTemplate abilityTemplate;
}
