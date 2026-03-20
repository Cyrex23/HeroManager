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

    // ── Spell fields (T3/T4 only) ──────────────────────────────────────────────
    @Column
    private String spellName;

    @Column(columnDefinition = "int default 0")
    private int spellManaCost = 0;

    @Column
    private String spellTrigger; // "ENTRANCE" or "ATTACK"

    @Column(columnDefinition = "double default 0")
    private double spellChance = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusPa = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusMp = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusDex = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusElem = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusMana = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusStam = 0;

    // ── Combat mechanics ───────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusAttack = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusMagicProficiency = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusSpellMastery = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusSpellActivation = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusDexProficiency = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusDexPosture = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusDexMaxPosture = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusCritChance = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusCritDamage = 0;

    // ── Progression bonuses ────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusExpBonus = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusGoldBonus = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusItemDiscovery = 0;

    // ── Damage immunities ──────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusPhysicalImmunity = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusMagicImmunity = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusDexEvasiveness = 0;

    // ── Extended passive sub-stats (abilities) ─────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusManaRecharge = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusTenacity = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusFatigueRecovery = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusCleanse = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusRot = 0;

    @Column(columnDefinition = "double default 0")
    private double bonusOffPositioning = 0;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "abilityTemplate")
    private java.util.List<AbilitySpell> spells = new java.util.ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "heroTemplateId", insertable = false, updatable = false)
    private HeroTemplate heroTemplate;
}
