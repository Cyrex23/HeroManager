package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "item_template")
@Getter
@Setter
@NoArgsConstructor
public class ItemTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private int cost;

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
}
