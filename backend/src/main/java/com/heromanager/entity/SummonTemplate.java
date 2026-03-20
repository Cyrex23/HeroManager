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

    @Column
    private double baseMagicProficiency;

    @Column
    private double growthMagicProficiency;

    @Column
    private double baseSpellMastery;

    @Column
    private double growthSpellMastery;

    @Column
    private double baseCritChance;

    @Column
    private double growthCritChance;

    @Column
    private double baseCritDamage;

    @Column
    private double growthCritDamage;

    @Column
    private double baseDex;

    @Column
    private double growthDex;

    @Column
    private double baseDexProficiency;

    @Column
    private double growthDexProficiency;

    @Column
    private double baseDexPosture;

    @Column
    private double growthDexPosture;

    @Column
    private double baseGoldBonus;

    @Column
    private double growthGoldBonus;

    @Column
    private double baseItemFind;

    @Column
    private double growthItemFind;

    @Column
    private double baseXpBonus;

    @Column
    private double growthXpBonus;

    @Column
    private double baseAttack;

    @Column
    private double growthAttack;

    @Column
    private double baseSpellActivation;

    @Column
    private double growthSpellActivation;

    @Column
    private double baseStamina;

    @Column
    private double growthStamina;

    @Column
    private double basePhysicalAttack;

    @Column
    private double growthPhysicalAttack;

    @Column(columnDefinition = "double default 0")
    private double basePhysicalImmunity;

    @Column(columnDefinition = "double default 0")
    private double growthPhysicalImmunity;

    @Column(columnDefinition = "double default 0")
    private double baseMagicImmunity;

    @Column(columnDefinition = "double default 0")
    private double growthMagicImmunity;

    @Column(columnDefinition = "double default 0")
    private double baseDexEvasiveness;

    @Column(columnDefinition = "double default 0")
    private double growthDexEvasiveness;

    @Column(columnDefinition = "double default 0")
    private double baseManaRecharge;

    @Column(columnDefinition = "double default 0")
    private double growthManaRecharge;

    @Column(columnDefinition = "double default 0")
    private double baseSpellLearn;

    @Column(columnDefinition = "double default 0")
    private double growthSpellLearn;

    @Column(columnDefinition = "double default 0")
    private double baseSpellCopy;

    @Column(columnDefinition = "double default 0")
    private double growthSpellCopy;

    @Column(columnDefinition = "double default 0")
    private double baseSpellAbsorb;

    @Column(columnDefinition = "double default 0")
    private double growthSpellAbsorb;

    @Column(columnDefinition = "double default 0")
    private double baseRot;

    @Column(columnDefinition = "double default 0")
    private double growthRot;
}
