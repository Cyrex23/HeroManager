package com.heromanager.entity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ability_spell")
@Getter @Setter @NoArgsConstructor
public class AbilitySpell {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long abilityTemplateId;

    @Column(nullable = false)
    private String spellName;

    @Column(columnDefinition = "int default 0")
    private int spellManaCost = 0;

    @Column
    private String spellTrigger; // ATTACK, ENTRANCE, AFTER_CLASH, AFTER_CLASH_CRIT, BEFORE_TURN_X, AFTER_TURN_X, OPPONENT_ENTRANCE

    @Column(columnDefinition = "double default 0")
    private double spellChance = 0;

    @Column(columnDefinition = "int default 0")
    private int maxUsages = 0; // 0 = unlimited

    @Column(columnDefinition = "int default 0")
    private int lastsTurns = 0; // 0 = instant

    @Column(columnDefinition = "boolean default false")
    private boolean affectsOpponent = false;

    @Column
    private String passOnType; // NEXT, TEAM, BATTLEFIELD

    // Basic stat bonuses
    @Column(columnDefinition = "double default 0") private double spellBonusPa = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusMp = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusDex = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusElem = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusMana = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusStam = 0;

    // Sub-stat bonuses (fractions 0-1 for %, flat for tenacity)
    @Column(columnDefinition = "double default 0") private double spellBonusAttack = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusMagicProficiency = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusSpellMastery = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusSpellActivation = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusDexProficiency = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusDexPosture = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusDexMaxPosture = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusCritChance = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusCritDamage = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusExpBonus = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusGoldBonus = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusItemDiscovery = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusPhysicalImmunity = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusMagicImmunity = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusDexEvasiveness = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusManaRecharge = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusTenacity = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusFatigueRecovery = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusCleanse = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusRot = 0;
    @Column(columnDefinition = "double default 0") private double spellBonusOffPositioning = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abilityTemplateId", insertable = false, updatable = false)
    private AbilityTemplate abilityTemplate;
}
