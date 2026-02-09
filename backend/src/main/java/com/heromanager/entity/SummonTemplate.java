package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "summon_template")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SummonTemplate {

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
    private Double baseMana;

    @Column(nullable = false)
    private Double baseMp;

    @Column(nullable = false)
    private Double growthMana;

    @Column(nullable = false)
    private Double growthMp;
}
