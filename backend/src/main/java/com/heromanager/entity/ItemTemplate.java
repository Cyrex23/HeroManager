package com.heromanager.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.ArrayList;
import java.util.List;

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

    // ── Combat mechanics ───────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusAttack = 0;           // bonus to PA contribution factor (+0.5 base)

    @Column(columnDefinition = "double default 0")
    private double bonusMagicProficiency = 0; // probability [0,1] to reroll MP and take best

    @Column(columnDefinition = "double default 0")
    private double bonusSpellMastery = 0;     // multiplier bonus applied to T3 spell stat bonuses

    @Column(columnDefinition = "double default 0")
    private double bonusSpellActivation = 0;  // bonus added to T4 spell trigger chance

    @Column(columnDefinition = "double default 0")
    private double bonusDexProficiency = 0;   // bonus to DEX contribution factor (+0.33 base)

    @Column(columnDefinition = "double default 0")
    private double bonusDexPosture = 0;       // [0,1] fraction of DEX immune to stamina penalty

    @Column(columnDefinition = "double default 0")
    private double bonusDexMaxPosture = 0;    // [0,1] fraction of MAX DEX recovered each round

    @Column(columnDefinition = "double default 0")
    private double bonusCritChance = 0;       // [0,1] probability of landing a critical hit

    @Column(columnDefinition = "double default 0")
    private double bonusCritDamage = 0;       // bonus crit multiplier (base crit = 1.5x)

    // ── Progression bonuses ────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusExpBonus = 0;         // fraction bonus XP this hero earns

    @Column(columnDefinition = "double default 0")
    private double bonusGoldBonus = 0;        // fraction bonus gold for the team (additive)

    @Column(columnDefinition = "double default 0")
    private double bonusItemDiscovery = 0;    // probability bonus of discovering extra gold post-battle

    // ── Damage immunities ──────────────────────────────────────────────────────
    @Column(columnDefinition = "double default 0")
    private double bonusPhysicalImmunity = 0; // [0,1] fraction of incoming PA damage negated

    @Column(columnDefinition = "double default 0")
    private double bonusMagicImmunity = 0;    // [0,1] fraction of incoming MP damage negated

    @Column(columnDefinition = "double default 0")
    private double bonusDexEvasiveness = 0;   // [0,1] fraction of incoming DEX damage negated

    // ── Blacksmith / Crafting ──────────────────────────────────────────────────
    @Column(columnDefinition = "boolean default false")
    private boolean isCraftable = false;

    @Column(length = 20)
    private String weaponTier;                // COMMON / EPIC / LEGENDARY

    @Column(length = 50)
    private String iconKey;                   // e.g. "weapons-common:0:0"

    // ── Weapon Spell ───────────────────────────────────────────────────────────
    @Column(length = 100)
    private String spellName;

    @Column(columnDefinition = "int default 0")
    private int spellManaCost = 0;

    @Column(length = 20)
    private String spellTrigger;              // ENTRANCE / ATTACK

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

    // ── Multiple Weapon Spells ─────────────────────────────────────────────────
    @OneToMany(mappedBy = "itemTemplate", fetch = FetchType.LAZY)
    private List<WeaponSpell> spells = new ArrayList<>();
}
