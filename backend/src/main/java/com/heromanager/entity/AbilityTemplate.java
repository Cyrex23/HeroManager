package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ability_template")
@Getter
@Setter
@NoArgsConstructor
public class AbilityTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Long heroTemplateId;

    @Column(nullable = false)
    private int cost;

    @Column(nullable = false)
    private int tier;

    @Column(nullable = false)
    private double bonusPa = 0;

    @Column(nullable = false)
    private double bonusMp = 0;

    @Column(nullable = false)
    private double bonusDex = 0;

    @Column(nullable = false)
    private double bonusElem = 0;

    @Column(nullable = false)
    private double bonusMana = 0;

    @Column(nullable = false)
    private double bonusStam = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "heroTemplateId", insertable = false, updatable = false)
    private HeroTemplate heroTemplate;
}
