package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "hero_template")
@Getter
@Setter
@NoArgsConstructor
public class HeroTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String imagePath;

    @Column(nullable = false)
    private int cost;

    @Column(nullable = false)
    private int capacity;

    @Column(nullable = false)
    private double basePa;

    @Column(nullable = false)
    private double baseMp;

    @Column(nullable = false)
    private double baseDex;

    @Column(nullable = false)
    private double baseElem;

    @Column(nullable = false)
    private double baseMana;

    @Column(nullable = false)
    private double baseStam;

    @Column(nullable = false)
    private double growthPa;

    @Column(nullable = false)
    private double growthMp;

    @Column(nullable = false)
    private double growthDex;

    @Column(nullable = false)
    private double growthElem;

    @Column(nullable = false)
    private double growthMana;

    @Column(nullable = false)
    private double growthStam;

    @Column(nullable = false)
    private boolean isStarter = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private HeroTier tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private HeroElement element;
}
