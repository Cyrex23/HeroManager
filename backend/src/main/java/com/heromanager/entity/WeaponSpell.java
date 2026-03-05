package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "weapon_spell")
@Getter
@Setter
@NoArgsConstructor
public class WeaponSpell {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_template_id", nullable = false)
    private ItemTemplate itemTemplate;

    @Column(nullable = false, length = 100)
    private String spellName;

    @Column(columnDefinition = "int default 0")
    private int spellManaCost = 0;

    // ENTRANCE | OPPONENT_ENTRANCE | ATTACK | AFTER_CLASH | AFTER_CLASH_CRIT | AFTER_CLASH_MAGIC_PROF | BEFORE_TURN_X | AFTER_TURN_X
    @Column(length = 30)
    private String spellTrigger;

    @Column(columnDefinition = "double default 0")
    private double spellChance = 0;

    // ── Meta constraints ──────────────────────────────────────────────────────
    @Column(columnDefinition = "int default 0")
    private int maxUsages = 0;       // 0 = unlimited

    @Column(columnDefinition = "int default 0")
    private int lastsTurns = 0;      // 0 = instant (current round only); >0 = persists N more rounds

    @Column(columnDefinition = "boolean default false")
    private boolean affectsOpponent = false;  // true = debuff opponent instead of self-buff

    @Column(columnDefinition = "int default 0")
    private int turnThreshold = 0;   // used by BEFORE_TURN_X and AFTER_TURN_X

    // ── Base stat bonuses ─────────────────────────────────────────────────────
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

    // ── Combat modifier bonuses ───────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double spellBonusAttack = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusMagicProficiency = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusSpellMastery = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusSpellActivation = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusDexProficiency = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusDexPosture = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusCritChance = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusCritDamage = 0;

    // ── Progression bonuses ───────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double spellBonusExpBonus = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusGoldBonus = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusItemDiscovery = 0;

    // ── Immunity bonuses ──────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double spellBonusPhysicalImmunity = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusMagicImmunity = 0;

    @Column(columnDefinition = "double default 0")
    private double spellBonusDexEvasiveness = 0;
}
