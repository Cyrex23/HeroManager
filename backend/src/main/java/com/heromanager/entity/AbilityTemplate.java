package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ability_template")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AbilityTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long heroTemplateId;

    @Column(nullable = false)
    private Integer cost;

    @Column(nullable = false)
    private Integer tier;

    @Builder.Default
    private Double bonusPa = 0.0;

    @Builder.Default
    private Double bonusMp = 0.0;

    @Builder.Default
    private Double bonusDex = 0.0;

    @Builder.Default
    private Double bonusElem = 0.0;

    @Builder.Default
    private Double bonusMana = 0.0;

    @Builder.Default
    private Double bonusStam = 0.0;
}
