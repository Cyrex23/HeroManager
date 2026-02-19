-- Schema migrations (idempotent, continue-on-error=true handles reruns)
ALTER TABLE equipped_item ALTER COLUMN hero_id SET NULL;
ALTER TABLE equipped_item ALTER COLUMN slot_number SET NULL;
ALTER TABLE equipped_item ADD COLUMN IF NOT EXISTS player_id BIGINT;
ALTER TABLE equipped_ability ALTER COLUMN hero_id SET NULL;
ALTER TABLE equipped_ability ADD COLUMN IF NOT EXISTS player_id BIGINT;
ALTER TABLE equipped_ability ADD COLUMN IF NOT EXISTS slot_number INT;

-- ── Deduplicate existing rows from historical non-idempotent seeding ────────
-- These UPDATE/DELETE statements are no-ops when there are no duplicates.
-- They run every restart but are safe due to continue-on-error=true.

-- 1. Fix equipped_item rows pointing to duplicate item_template rows, then delete dupes
UPDATE equipped_item SET item_template_id = (
    SELECT MIN(t2.id) FROM item_template t2
    WHERE t2.name = (SELECT t.name FROM item_template t WHERE t.id = equipped_item.item_template_id)
) WHERE item_template_id NOT IN (SELECT MIN(id) FROM item_template GROUP BY name);
DELETE FROM item_template WHERE id NOT IN (SELECT MIN(id) FROM item_template GROUP BY name);

-- 2. Fix equipped_ability rows pointing to duplicate ability_template rows, then delete dupes
UPDATE equipped_ability SET ability_template_id = (
    SELECT MIN(a2.id) FROM ability_template a2
    WHERE a2.name = (SELECT a.name FROM ability_template a WHERE a.id = equipped_ability.ability_template_id)
    AND a2.hero_template_id = (SELECT a.hero_template_id FROM ability_template a WHERE a.id = equipped_ability.ability_template_id)
) WHERE ability_template_id NOT IN (SELECT MIN(id) FROM ability_template GROUP BY name, hero_template_id);
DELETE FROM ability_template WHERE id NOT IN (SELECT MIN(id) FROM ability_template GROUP BY name, hero_template_id);

-- 3. Fix hero rows pointing to duplicate hero_template rows, then delete dupes
UPDATE hero SET template_id = (
    SELECT MIN(t2.id) FROM hero_template t2
    WHERE t2.name = (SELECT t.name FROM hero_template t WHERE t.id = hero.template_id)
) WHERE template_id NOT IN (SELECT MIN(id) FROM hero_template GROUP BY name);
DELETE FROM hero_template WHERE id NOT IN (SELECT MIN(id) FROM hero_template GROUP BY name);

-- 4. Fix summon rows pointing to duplicate summon_template rows, then delete dupes
UPDATE summon SET template_id = (
    SELECT MIN(t2.id) FROM summon_template t2
    WHERE t2.name = (SELECT t.name FROM summon_template t WHERE t.id = summon.template_id)
) WHERE template_id NOT IN (SELECT MIN(id) FROM summon_template GROUP BY name);
DELETE FROM summon_template WHERE id NOT IN (SELECT MIN(id) FROM summon_template GROUP BY name);

-- ── Seed Data for HeroManager (all inserts idempotent via WHERE NOT EXISTS) ─

-- Hero Templates
INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'konohamaru-genin', 'Konohamaru Genin', 'konohamaru-genin.jpg', 0, 5, 5, 8, 3, 2, 20, 10, 0.8, 1.0, 0.2, 0.7, 1.0, 1.0, true
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'konohamaru-genin');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'sakura', 'Sakura', 'sakura.gif', 200, 8, 4, 12, 4, 5, 30, 12, 0.5, 1.5, 0.3, 1.0, 1.5, 1.2, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'sakura');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'hidan', 'Hidan', 'hidan.gif', 400, 10, 14, 3, 5, 2, 15, 18, 1.5, 0.3, 0.5, 0.3, 0.8, 1.8, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'hidan');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'konan', 'Konan', 'konan.gif', 400, 10, 6, 10, 8, 6, 22, 12, 0.7, 1.2, 0.8, 0.8, 1.2, 1.0, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'konan');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'kabuto', 'Kabuto', 'kabuto.gif', 400, 15, 7, 14, 6, 8, 28, 14, 0.8, 1.6, 0.5, 1.2, 1.5, 1.2, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'kabuto');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'kakashi', 'Kakashi', 'kakashi.gif', 400, 15, 12, 11, 9, 7, 25, 15, 1.3, 1.3, 0.9, 0.9, 1.3, 1.3, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'kakashi');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'deidara', 'Deidara', 'deidara.gif', 400, 20, 8, 16, 5, 12, 32, 10, 0.9, 1.8, 0.4, 1.5, 1.8, 0.8, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'deidara');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'minato', 'Minato', 'minato.gif', 2000, 30, 15, 14, 14, 10, 30, 20, 1.6, 1.5, 1.4, 1.2, 1.5, 1.8, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'minato');

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'hashirama', 'Hashirama', 'hashirama.gif', 2000, 30, 16, 16, 8, 12, 35, 22, 1.7, 1.7, 0.8, 1.4, 2.0, 2.0, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'hashirama');

-- Summon Template
INSERT INTO summon_template (name, display_name, image_path, cost, capacity, base_mana, base_mp, growth_mana, growth_mp)
SELECT 'susanoo-spirit-summon', 'Susanoo Spirit Summon', 'susanoo-spirit-summon.jpg', 300, 15, 10, 5, 5, 4
WHERE NOT EXISTS (SELECT 1 FROM summon_template WHERE name = 'susanoo-spirit-summon');

-- Item Templates
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Training Weights', 100, 3, 0, 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Training Weights');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Iron Kunai', 100, 2, 0, 1, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Iron Kunai');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Chakra Scroll', 100, 0, 3, 0, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Chakra Scroll');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Mana Crystal', 100, 0, 0, 0, 0, 5, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Mana Crystal');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Swift Boots', 100, 0, 0, 3, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Swift Boots');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Warrior Armor', 300, 6, 0, 0, 0, 0, 4 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Warrior Armor');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Mystic Tome', 300, 0, 6, 0, 0, 8, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Mystic Tome');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Shadow Cloak', 300, 0, 0, 5, 0, 0, 3 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Shadow Cloak');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Legendary Blade', 600, 12, 0, 5, 0, 0, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Legendary Blade');
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Sage Staff', 600, 0, 12, 0, 0, 12, 0 WHERE NOT EXISTS (SELECT 1 FROM item_template WHERE name = 'Sage Staff');

-- Hero tiers and elements (UPDATE so these apply on re-run without errors)
UPDATE hero_template SET tier = 'COMMONER', element = 'WATER'    WHERE name = 'konohamaru-genin';
UPDATE hero_template SET tier = 'COMMONER', element = 'WATER'    WHERE name = 'sakura';
UPDATE hero_template SET tier = 'ELITE',    element = 'FIRE'     WHERE name = 'hidan';
UPDATE hero_template SET tier = 'ELITE',    element = 'FIRE'     WHERE name = 'konan';
UPDATE hero_template SET tier = 'ELITE',    element = 'WIND'     WHERE name = 'kabuto';
UPDATE hero_template SET tier = 'ELITE',    element = 'LIGHTNING' WHERE name = 'kakashi';
UPDATE hero_template SET tier = 'ELITE',    element = 'EARTH'    WHERE name = 'deidara';
UPDATE hero_template SET tier = 'LEGENDARY', element = 'WIND'    WHERE name = 'minato';
UPDATE hero_template SET tier = 'LEGENDARY', element = 'EARTH'   WHERE name = 'hashirama';

-- Ability Templates (idempotent via WHERE NOT EXISTS referencing hero by name)
-- Konohamaru-Genin
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Power Strike', id, 50, 1, 2, 0, 0, 0, 0, 0 FROM hero_template WHERE name = 'konohamaru-genin' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Power Strike' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konohamaru-genin'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Chakra Burst', id, 200, 2, 0, 3, 2, 0, 0, 0 FROM hero_template WHERE name = 'konohamaru-genin' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Chakra Burst' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konohamaru-genin'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Iron Fist', id, 400, 3, 5, 0, 0, 0, 0, 3 FROM hero_template WHERE name = 'konohamaru-genin' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Iron Fist' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konohamaru-genin'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Sage Mode', id, 800, 4, 0, 8, 0, 0, 5, 0 FROM hero_template WHERE name = 'konohamaru-genin' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Sage Mode' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konohamaru-genin'));

-- Sakura
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Healing Touch', id, 50, 1, 0, 3, 0, 0, 0, 0 FROM hero_template WHERE name = 'sakura' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Healing Touch' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'sakura'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Chakra Control', id, 200, 2, 0, 2, 0, 0, 5, 0 FROM hero_template WHERE name = 'sakura' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Chakra Control' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'sakura'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Diamond Seal', id, 400, 3, 0, 6, 0, 0, 0, 4 FROM hero_template WHERE name = 'sakura' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Diamond Seal' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'sakura'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Hundred Healings', id, 800, 4, 0, 10, 0, 0, 8, 0 FROM hero_template WHERE name = 'sakura' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Hundred Healings' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'sakura'));

-- Hidan
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Blood Slash', id, 50, 1, 3, 0, 0, 0, 0, 0 FROM hero_template WHERE name = 'hidan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Blood Slash' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hidan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Ritual Strike', id, 200, 2, 4, 0, 0, 0, 0, 3 FROM hero_template WHERE name = 'hidan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Ritual Strike' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hidan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Reaper Assault', id, 400, 3, 8, 0, 2, 0, 0, 0 FROM hero_template WHERE name = 'hidan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Reaper Assault' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hidan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Immortal Fury', id, 800, 4, 12, 0, 0, 0, 0, 6 FROM hero_template WHERE name = 'hidan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Immortal Fury' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hidan'));

-- Konan
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Paper Shuriken', id, 50, 1, 0, 0, 2, 0, 0, 0 FROM hero_template WHERE name = 'konan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Paper Shuriken' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Origami Shield', id, 200, 2, 0, 3, 3, 0, 0, 0 FROM hero_template WHERE name = 'konan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Origami Shield' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Paper Storm', id, 400, 3, 0, 5, 5, 0, 0, 0 FROM hero_template WHERE name = 'konan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Paper Storm' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konan'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Angel Descent', id, 800, 4, 0, 8, 6, 0, 0, 4 FROM hero_template WHERE name = 'konan' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Angel Descent' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'konan'));

-- Kabuto
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Poison Mist', id, 50, 1, 0, 3, 0, 0, 0, 0 FROM hero_template WHERE name = 'kabuto' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Poison Mist' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kabuto'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Chakra Scalpel', id, 200, 2, 0, 4, 0, 3, 0, 0 FROM hero_template WHERE name = 'kabuto' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Chakra Scalpel' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kabuto'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Sage Transformation', id, 400, 3, 0, 7, 0, 0, 5, 0 FROM hero_template WHERE name = 'kabuto' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Sage Transformation' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kabuto'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Edo Tensei', id, 800, 4, 0, 10, 0, 8, 0, 0 FROM hero_template WHERE name = 'kabuto' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Edo Tensei' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kabuto'));

-- Kakashi
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Quick Strike', id, 50, 1, 2, 0, 1, 0, 0, 0 FROM hero_template WHERE name = 'kakashi' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Quick Strike' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kakashi'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Lightning Blade', id, 200, 2, 4, 3, 0, 0, 0, 0 FROM hero_template WHERE name = 'kakashi' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Lightning Blade' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kakashi'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Sharingan Copy', id, 400, 3, 6, 5, 0, 0, 0, 0 FROM hero_template WHERE name = 'kakashi' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Sharingan Copy' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kakashi'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Kamui', id, 800, 4, 9, 8, 4, 0, 0, 0 FROM hero_template WHERE name = 'kakashi' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Kamui' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'kakashi'));

-- Deidara
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Clay Bomb', id, 50, 1, 0, 0, 0, 3, 0, 0 FROM hero_template WHERE name = 'deidara' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Clay Bomb' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'deidara'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'C2 Dragon', id, 200, 2, 0, 5, 0, 3, 0, 0 FROM hero_template WHERE name = 'deidara' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'C2 Dragon' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'deidara'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'C3 Megaton', id, 400, 3, 0, 8, 0, 6, 0, 0 FROM hero_template WHERE name = 'deidara' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'C3 Megaton' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'deidara'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'C4 Karura', id, 800, 4, 0, 12, 0, 10, 0, 0 FROM hero_template WHERE name = 'deidara' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'C4 Karura' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'deidara'));

-- Minato
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Flash Step', id, 50, 1, 0, 0, 3, 0, 0, 0 FROM hero_template WHERE name = 'minato' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Flash Step' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'minato'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Rasengan', id, 200, 2, 5, 0, 4, 0, 0, 0 FROM hero_template WHERE name = 'minato' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Rasengan' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'minato'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Flying Thunder God', id, 400, 3, 8, 0, 6, 0, 0, 0 FROM hero_template WHERE name = 'minato' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Flying Thunder God' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'minato'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Reaper Death Seal', id, 800, 4, 12, 0, 10, 0, 0, 5 FROM hero_template WHERE name = 'minato' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Reaper Death Seal' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'minato'));

-- Hashirama
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Wood Shield', id, 50, 1, 0, 0, 0, 0, 0, 3 FROM hero_template WHERE name = 'hashirama' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Wood Shield' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hashirama'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Forest Growth', id, 200, 2, 0, 5, 0, 0, 0, 4 FROM hero_template WHERE name = 'hashirama' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Forest Growth' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hashirama'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Deep Forest Bloom', id, 400, 3, 0, 8, 0, 0, 0, 8 FROM hero_template WHERE name = 'hashirama' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Deep Forest Bloom' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hashirama'));
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) SELECT 'Sage Art: True Golem', id, 800, 4, 0, 12, 0, 0, 8, 10 FROM hero_template WHERE name = 'hashirama' AND NOT EXISTS (SELECT 1 FROM ability_template WHERE name = 'Sage Art: True Golem' AND hero_template_id = (SELECT id FROM hero_template WHERE name = 'hashirama'));

-- ── Zabuza (idempotent) ─────────────────────────────────────────────────────
INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
SELECT 'zabuza', 'Zabuza', 'zabuza.gif', 150, 8, 4, 2, 14, 4, 18, 12, 0.4, 0.2, 1.6, 0.6, 0.9, 1.1, false
WHERE NOT EXISTS (SELECT 1 FROM hero_template WHERE name = 'zabuza');

UPDATE hero_template SET tier = 'COMMONER', element = 'WATER' WHERE name = 'zabuza';

INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam)
SELECT 'Silent Killing', id, 50, 1, 0, 0, 3, 0, 0, 0 FROM hero_template WHERE name = 'zabuza'
AND NOT EXISTS (SELECT 1 FROM ability_template a WHERE a.hero_template_id = (SELECT id FROM hero_template WHERE name = 'zabuza') AND a.name = 'Silent Killing');

INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam)
SELECT 'Executioner Blade', id, 200, 2, 2, 0, 5, 0, 0, 0 FROM hero_template WHERE name = 'zabuza'
AND NOT EXISTS (SELECT 1 FROM ability_template a WHERE a.hero_template_id = (SELECT id FROM hero_template WHERE name = 'zabuza') AND a.name = 'Executioner Blade');

INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam)
SELECT 'Water Prison', id, 400, 3, 0, 0, 8, 4, 0, 3 FROM hero_template WHERE name = 'zabuza'
AND NOT EXISTS (SELECT 1 FROM ability_template a WHERE a.hero_template_id = (SELECT id FROM hero_template WHERE name = 'zabuza') AND a.name = 'Water Prison');

INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam)
SELECT 'Demon of the Hidden Mist', id, 800, 4, 0, 0, 14, 6, 0, 4 FROM hero_template WHERE name = 'zabuza'
AND NOT EXISTS (SELECT 1 FROM ability_template a WHERE a.hero_template_id = (SELECT id FROM hero_template WHERE name = 'zabuza') AND a.name = 'Demon of the Hidden Mist');
