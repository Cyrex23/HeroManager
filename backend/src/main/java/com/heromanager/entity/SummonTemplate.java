package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "summon_template")
@Getter
@Setter
@NoArgsConstructor
public class SummonTemplate {

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
    private double baseMana;

    @Column(nullable = false)
    private double baseMp;

    @Column(nullable = false)
    private double growthMana;

    @Column(nullable = false)
    private double growthMp;
}
