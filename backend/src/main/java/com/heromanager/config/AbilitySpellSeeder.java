package com.heromanager.config;

import com.heromanager.entity.AbilitySpell;
import com.heromanager.entity.AbilityTemplate;
import com.heromanager.entity.HeroTemplate;
import com.heromanager.repository.AbilitySpellRepository;
import com.heromanager.repository.AbilityTemplateRepository;
import com.heromanager.repository.HeroTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the ability_spell table at startup using JPA (no raw SQL).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AbilitySpellSeeder implements ApplicationRunner {

    private final HeroTemplateRepository heroTemplateRepo;
    private final AbilityTemplateRepository abilityTemplateRepo;
    private final AbilitySpellRepository abilitySpellRepo;

    @Override
    public void run(ApplicationArguments args) {
        long before = abilitySpellRepo.count();
        log.info("AbilitySpellSeeder: {} rows before seeding", before);
        insertAll();
        long after = abilitySpellRepo.count();
        log.info("AbilitySpellSeeder: done — {} total ({} new)", after, after - before);
    }

    private AbilityTemplate findTemplate(String heroName, String abilityName) {
        HeroTemplate ht = heroTemplateRepo.findByName(heroName).orElse(null);
        if (ht == null) {
            log.warn("AbilitySpellSeeder: hero '{}' not found", heroName);
            return null;
        }
        AbilityTemplate at = abilityTemplateRepo
            .findByNameAndHeroTemplateId(abilityName, ht.getId()).orElse(null);
        if (at == null) {
            log.warn("AbilitySpellSeeder: ability '{}' for hero '{}' not found", abilityName, heroName);
        }
        return at;
    }

    private void save(AbilityTemplate at, AbilitySpell spell) {
        if (at == null) return;
        boolean exists = abilitySpellRepo.findByAbilityTemplate(at)
            .stream().anyMatch(s -> s.getSpellName().equals(spell.getSpellName()));
        if (exists) {
            log.debug("AbilitySpellSeeder: '{}' already exists, skipping", spell.getSpellName());
            return;
        }
        try {
            spell.setAbilityTemplate(at);
            abilitySpellRepo.save(spell);
            log.info("AbilitySpellSeeder: inserted '{}' for template id={}", spell.getSpellName(), at.getId());
        } catch (Exception e) {
            log.error("AbilitySpellSeeder: FAILED to insert '{}' — {}", spell.getSpellName(), e.getMessage(), e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers to build AbilitySpell objects without repeating all null fields
    // ─────────────────────────────────────────────────────────────────────────

    private static AbilitySpell spell(String name, String trigger, double chance, int mana,
                                       int maxUses, int lastsTurns, boolean affectsOpp, String passOn) {
        AbilitySpell s = new AbilitySpell();
        s.setSpellName(name);
        s.setSpellTrigger(trigger);
        s.setSpellChance(chance);
        s.setSpellManaCost(mana);
        s.setMaxUsages(maxUses);
        s.setLastsTurns(lastsTurns);
        s.setAffectsOpponent(affectsOpp);
        s.setPassOnType(passOn);
        return s;
    }

    private void insertAll() {
        AbilityTemplate at;

        // ── KONOHAMARU-GENIN ─────────────────────────────────────────────────
        at = findTemplate("konohamaru-genin", "Iron Fist");
        {   AbilitySpell s = spell("Iron Fist Barrage","ATTACK",0.35,25,0,0,false,null);
            s.setSpellBonusPa(15); s.setSpellBonusStam(10); s.setSpellBonusCritDamage(0.08);
            save(at, s); }

        at = findTemplate("konohamaru-genin", "Sage Mode");
        {   AbilitySpell s = spell("Sage Awakening","ENTRANCE",0.70,45,0,0,false,null);
            s.setSpellBonusPa(15); s.setSpellBonusMp(20); s.setSpellBonusSpellMastery(0.10);
            save(at, s); }
        {   AbilitySpell s = spell("Nature Empowerment","AFTER_CLASH",0.45,30,0,0,false,"TEAM");
            s.setSpellBonusAttack(0.10); s.setSpellBonusCritChance(0.08);
            save(at, s); }

        // ── SAKURA ───────────────────────────────────────────────────────────
        at = findTemplate("sakura", "Diamond Seal");
        {   AbilitySpell s = spell("Byakugo Seal","ENTRANCE",0.60,30,0,3,false,null);
            s.setSpellBonusMp(12); s.setSpellBonusStam(20); s.setSpellBonusFatigueRecovery(0.10);
            save(at, s); }

        at = findTemplate("sakura", "Hundred Healings");
        {   AbilitySpell s = spell("Endless Regeneration","ATTACK",0.40,55,0,3,false,null);
            s.setSpellBonusStam(25); s.setSpellBonusFatigueRecovery(0.12); s.setSpellBonusCleanse(0.06);
            save(at, s); }
        {   AbilitySpell s = spell("Mending Wave","AFTER_CLASH",0.55,35,0,0,false,"NEXT");
            s.setSpellBonusStam(20); s.setSpellBonusDexPosture(0.05); s.setSpellBonusFatigueRecovery(0.10);
            save(at, s); }

        // ── HIDAN ────────────────────────────────────────────────────────────
        at = findTemplate("hidan", "Reaper Assault");
        {   AbilitySpell s = spell("Jashin's Blessing","ATTACK",0.40,30,0,0,false,null);
            s.setSpellBonusPa(22); s.setSpellBonusAttack(0.08); s.setSpellBonusCritChance(0.05);
            save(at, s); }

        at = findTemplate("hidan", "Immortal Fury");
        {   AbilitySpell s = spell("Curse Mark Frenzy","ATTACK",0.50,55,0,0,false,null);
            s.setSpellBonusPa(30); s.setSpellBonusStam(12); s.setSpellBonusAttack(0.10); s.setSpellBonusCritChance(0.08);
            save(at, s); }
        {   AbilitySpell s = spell("Blood Ritual","AFTER_CLASH_CRIT",0.65,40,0,0,true,null);
            s.setSpellBonusStam(-15); s.setSpellBonusDexPosture(-0.08); s.setSpellBonusRot(0.10);
            save(at, s); }

        // ── KONAN ────────────────────────────────────────────────────────────
        at = findTemplate("konan", "Paper Storm");
        {   AbilitySpell s = spell("Shuriken Volley","ATTACK",0.45,28,0,0,false,null);
            s.setSpellBonusMp(12); s.setSpellBonusDex(18); s.setSpellBonusDexProficiency(0.08);
            save(at, s); }

        at = findTemplate("konan", "Angel Descent");
        {   AbilitySpell s = spell("Six Paths Formation","ENTRANCE",0.75,60,0,0,false,null);
            s.setSpellBonusMp(25); s.setSpellBonusElem(18); s.setSpellBonusSpellActivation(0.12);
            save(at, s); }
        {   AbilitySpell s = spell("Sacred Paper Armour","ENTRANCE",0.50,40,0,0,false,"BATTLEFIELD");
            s.setSpellBonusPhysicalImmunity(0.15); s.setSpellBonusMagicImmunity(0.08);
            save(at, s); }

        // ── KABUTO ───────────────────────────────────────────────────────────
        at = findTemplate("kabuto", "Sage Transformation");
        {   AbilitySpell s = spell("Snake Sage Mode","ENTRANCE",0.55,40,0,4,false,null);
            s.setSpellBonusPa(12); s.setSpellBonusMp(20); s.setSpellBonusMagicProficiency(0.08);
            save(at, s); }

        at = findTemplate("kabuto", "Edo Tensei");
        {   AbilitySpell s = spell("Revenant Surge","ATTACK",0.30,70,0,0,false,null);
            s.setSpellBonusMp(35); s.setSpellBonusElem(10); s.setSpellBonusSpellMastery(0.15); s.setSpellBonusManaRecharge(0.05);
            save(at, s); }
        {   AbilitySpell s = spell("Medical Override","AFTER_CLASH",0.60,45,0,0,true,null);
            s.setSpellBonusMp(-20); s.setSpellBonusMana(-10); s.setSpellBonusMagicProficiency(-0.12);
            save(at, s); }

        // ── KAKASHI ──────────────────────────────────────────────────────────
        at = findTemplate("kakashi", "Sharingan Copy");
        {   AbilitySpell s = spell("Mirror Technique","ATTACK",0.40,35,0,0,false,null);
            s.setSpellBonusMp(18); s.setSpellBonusDex(12); s.setSpellBonusSpellMastery(0.06); s.setSpellBonusSpellActivation(0.10);
            save(at, s); }

        at = findTemplate("kakashi", "Kamui");
        {   AbilitySpell s = spell("Dimensional Rift","ATTACK",0.25,65,2,0,false,null);
            s.setSpellBonusDex(45); s.setSpellBonusDexProficiency(0.15); s.setSpellBonusDexMaxPosture(0.08); s.setSpellBonusDexEvasiveness(0.10);
            save(at, s); }
        {   AbilitySpell s = spell("Kamui Eye Drain","ATTACK",0.45,50,0,0,true,null);
            s.setSpellBonusDex(-20); s.setSpellBonusSpellActivation(-0.10); s.setSpellBonusDexPosture(-0.15);
            save(at, s); }

        // ── DEIDARA ──────────────────────────────────────────────────────────
        at = findTemplate("deidara", "C3 Megaton");
        {   AbilitySpell s = spell("Megaton Blast","ATTACK",0.35,40,0,0,false,null);
            s.setSpellBonusElem(28); s.setSpellBonusAttack(0.10); s.setSpellBonusCritDamage(0.08);
            save(at, s); }

        at = findTemplate("deidara", "C4 Karura");
        {   AbilitySpell s = spell("Cellular Explosion","ENTRANCE",0.60,70,0,0,false,null);
            s.setSpellBonusMp(15); s.setSpellBonusElem(35); s.setSpellBonusSpellMastery(0.12); s.setSpellBonusSpellActivation(0.10);
            save(at, s); }
        {   AbilitySpell s = spell("Art is a BANG!","AFTER_CLASH_CRIT",0.70,55,0,0,true,null);
            s.setSpellBonusElem(-25); s.setSpellBonusStam(-10); s.setSpellBonusPhysicalImmunity(-0.12);
            save(at, s); }

        // ── MINATO ───────────────────────────────────────────────────────────
        at = findTemplate("minato", "Flying Thunder God");
        {   AbilitySpell s = spell("Space-Time Strike","ATTACK",0.50,30,0,0,false,null);
            s.setSpellBonusPa(12); s.setSpellBonusDex(25); s.setSpellBonusDexProficiency(0.10); s.setSpellBonusOffPositioning(0.06);
            save(at, s); }

        at = findTemplate("minato", "Reaper Death Seal");
        {   AbilitySpell s = spell("Death God's Pact","ENTRANCE",0.45,80,0,0,false,null);
            s.setSpellBonusPa(35); s.setSpellBonusMp(18); s.setSpellBonusCritChance(0.15); s.setSpellBonusCritDamage(0.12);
            save(at, s); }
        {   AbilitySpell s = spell("Soul Seal Curse","OPPONENT_ENTRANCE",0.65,60,0,0,true,"BATTLEFIELD");
            s.setSpellBonusPa(-18); s.setSpellBonusAttack(-0.12); s.setSpellBonusSpellActivation(-0.10);
            save(at, s); }

        // ── HASHIRAMA ────────────────────────────────────────────────────────
        at = findTemplate("hashirama", "Deep Forest Bloom");
        {   AbilitySpell s = spell("Mokuton Bloom","ENTRANCE",0.65,35,0,3,false,null);
            s.setSpellBonusElem(15); s.setSpellBonusStam(20); s.setSpellBonusFatigueRecovery(0.10); s.setSpellBonusCleanse(0.06);
            save(at, s); }

        at = findTemplate("hashirama", "Sage Art: True Golem");
        {   AbilitySpell s = spell("Wood Dragon","ENTRANCE",0.50,75,0,0,false,null);
            s.setSpellBonusPa(30); s.setSpellBonusStam(25); s.setSpellBonusPhysicalImmunity(0.12); s.setSpellBonusMagicImmunity(0.06);
            save(at, s); }
        {   AbilitySpell s = spell("Forest Restoration","AFTER_CLASH",0.55,50,0,0,false,"TEAM");
            s.setSpellBonusStam(15); s.setSpellBonusDexPosture(0.08); s.setSpellBonusTenacity(2); s.setSpellBonusFatigueRecovery(0.10);
            save(at, s); }

        // ── ZABUZA ───────────────────────────────────────────────────────────
        at = findTemplate("zabuza", "Water Prison");
        {   AbilitySpell s = spell("Prison Trap","ATTACK",0.40,32,0,0,false,null);
            s.setSpellBonusPa(20); s.setSpellBonusStam(15); s.setSpellBonusAttack(0.08); s.setSpellBonusOffPositioning(0.06);
            save(at, s); }

        at = findTemplate("zabuza", "Demon of the Hidden Mist");
        {   AbilitySpell s = spell("Demon's Mist","ENTRANCE",0.55,60,0,0,false,null);
            s.setSpellBonusPa(18); s.setSpellBonusDex(28); s.setSpellBonusDexEvasiveness(0.12); s.setSpellBonusOffPositioning(0.10);
            save(at, s); }
        {   AbilitySpell s = spell("Silent Kill","ATTACK",0.45,45,3,0,true,null);
            s.setSpellBonusDex(-15); s.setSpellBonusDexProficiency(-0.08); s.setSpellBonusDexPosture(-0.10);
            save(at, s); }
    }
}
