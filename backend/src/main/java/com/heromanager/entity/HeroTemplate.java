package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hero_template")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HeroTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false)
    private String imagePath;

    @Column(nullable = false)
    private Integer cost;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private Double basePa;

    @Column(nullable = false)
    private Double baseMp;

    @Column(nullable = false)
    private Double baseDex;

    @Column(nullable = false)
    private Double baseElem;

    @Column(nullable = false)
    private Double baseMana;

    @Column(nullable = false)
    private Double baseStam;

    @Column(nullable = false)
    private Double growthPa;

    @Column(nullable = false)
    private Double growthMp;

    @Column(nullable = false)
    private Double growthDex;

    @Column(nullable = false)
    private Double growthElem;

    @Column(nullable = false)
    private Double growthMana;

    @Column(nullable = false)
    private Double growthStam;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isStarter = false;
}
