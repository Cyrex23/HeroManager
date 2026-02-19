-- Seed Data for HeroManager
-- Hero Templates (9 heroes: 1 starter + 8 shop heroes)
-- Stats from research.md R-005

INSERT INTO hero_template (name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter)
VALUES
('konohamaru-genin', 'Konohamaru Genin', 'konohamaru-genin.jpg', 0, 5, 5, 8, 3, 2, 20, 10, 0.8, 1.0, 0.2, 0.7, 1.0, 1.0, true),
('sakura', 'Sakura', 'sakura.gif', 200, 8, 4, 12, 4, 5, 30, 12, 0.5, 1.5, 0.3, 1.0, 1.5, 1.2, false),
('hidan', 'Hidan', 'hidan.gif', 400, 10, 14, 3, 5, 2, 15, 18, 1.5, 0.3, 0.5, 0.3, 0.8, 1.8, false),
('konan', 'Konan', 'konan.gif', 400, 10, 6, 10, 8, 6, 22, 12, 0.7, 1.2, 0.8, 0.8, 1.2, 1.0, false),
('kabuto', 'Kabuto', 'kabuto.gif', 400, 15, 7, 14, 6, 8, 28, 14, 0.8, 1.6, 0.5, 1.2, 1.5, 1.2, false),
('kakashi', 'Kakashi', 'kakashi.gif', 400, 15, 12, 11, 9, 7, 25, 15, 1.3, 1.3, 0.9, 0.9, 1.3, 1.3, false),
('deidara', 'Deidara', 'deidara.gif', 400, 20, 8, 16, 5, 12, 32, 10, 0.9, 1.8, 0.4, 1.5, 1.8, 0.8, false),
('minato', 'Minato', 'minato.gif', 2000, 30, 15, 14, 14, 10, 30, 20, 1.6, 1.5, 1.4, 1.2, 1.5, 1.8, false),
('hashirama', 'Hashirama', 'hashirama.gif', 2000, 30, 16, 16, 8, 12, 35, 22, 1.7, 1.7, 0.8, 1.4, 2.0, 2.0, false);

-- Summon Template
INSERT INTO summon_template (name, display_name, image_path, cost, capacity, base_mana, base_mp, growth_mana, growth_mp)
VALUES ('susanoo-spirit-summon', 'Susanoo Spirit Summon', 'susanoo-spirit-summon.jpg', 300, 15, 10, 5, 5, 4);

-- Item Templates (10 items from research.md R-006)
INSERT INTO item_template (name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Training Weights', 100, 3, 0, 0, 0, 0, 0),
('Iron Kunai', 100, 2, 0, 1, 0, 0, 0),
('Chakra Scroll', 100, 0, 3, 0, 0, 0, 0),
('Mana Crystal', 100, 0, 0, 0, 0, 5, 0),
('Swift Boots', 100, 0, 0, 3, 0, 0, 0),
('Warrior Armor', 300, 6, 0, 0, 0, 0, 4),
('Mystic Tome', 300, 0, 6, 0, 0, 8, 0),
('Shadow Cloak', 300, 0, 0, 5, 0, 0, 3),
('Legendary Blade', 600, 12, 0, 5, 0, 0, 0),
('Sage Staff', 600, 0, 12, 0, 0, 12, 0);

-- Hero tiers and elements (UPDATE so these apply on re-run without errors)
UPDATE hero_template SET tier = 'COMMONER', element = 'WATER'     WHERE name = 'konohamaru-genin';
UPDATE hero_template SET tier = 'COMMONER', element = 'WATER'     WHERE name = 'sakura';
UPDATE hero_template SET tier = 'ELITE',    element = 'FIRE'      WHERE name = 'hidan';
UPDATE hero_template SET tier = 'ELITE',    element = 'FIRE'      WHERE name = 'konan';
UPDATE hero_template SET tier = 'ELITE',    element = 'WIND'       WHERE name = 'kabuto';
UPDATE hero_template SET tier = 'ELITE',    element = 'LIGHTNING' WHERE name = 'kakashi';
UPDATE hero_template SET tier = 'ELITE',    element = 'EARTH'     WHERE name = 'deidara';
UPDATE hero_template SET tier = 'LEGENDARY', element = 'WIND'     WHERE name = 'minato';
UPDATE hero_template SET tier = 'LEGENDARY', element = 'EARTH'    WHERE name = 'hashirama';

-- Ability Templates (4 per hero, 9 heroes = 36 abilities, from research.md R-007)
-- Konohamaru-Genin abilities (heroTemplateId = 1)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Power Strike', 1, 50, 1, 2, 0, 0, 0, 0, 0),
('Chakra Burst', 1, 200, 2, 0, 3, 2, 0, 0, 0),
('Iron Fist', 1, 400, 3, 5, 0, 0, 0, 0, 3),
('Sage Mode', 1, 800, 4, 0, 8, 0, 0, 5, 0);

-- Sakura abilities (heroTemplateId = 2)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Healing Touch', 2, 50, 1, 0, 3, 0, 0, 0, 0),
('Chakra Control', 2, 200, 2, 0, 2, 0, 0, 5, 0),
('Diamond Seal', 2, 400, 3, 0, 6, 0, 0, 0, 4),
('Hundred Healings', 2, 800, 4, 0, 10, 0, 0, 8, 0);

-- Hidan abilities (heroTemplateId = 3)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Blood Slash', 3, 50, 1, 3, 0, 0, 0, 0, 0),
('Ritual Strike', 3, 200, 2, 4, 0, 0, 0, 0, 3),
('Reaper Assault', 3, 400, 3, 8, 0, 2, 0, 0, 0),
('Immortal Fury', 3, 800, 4, 12, 0, 0, 0, 0, 6);

-- Konan abilities (heroTemplateId = 4)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Paper Shuriken', 4, 50, 1, 0, 0, 2, 0, 0, 0),
('Origami Shield', 4, 200, 2, 0, 3, 3, 0, 0, 0),
('Paper Storm', 4, 400, 3, 0, 5, 5, 0, 0, 0),
('Angel Descent', 4, 800, 4, 0, 8, 6, 0, 0, 4);

-- Kabuto abilities (heroTemplateId = 5)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Poison Mist', 5, 50, 1, 0, 3, 0, 0, 0, 0),
('Chakra Scalpel', 5, 200, 2, 0, 4, 0, 3, 0, 0),
('Sage Transformation', 5, 400, 3, 0, 7, 0, 0, 5, 0),
('Edo Tensei', 5, 800, 4, 0, 10, 0, 8, 0, 0);

-- Kakashi abilities (heroTemplateId = 6)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Quick Strike', 6, 50, 1, 2, 0, 1, 0, 0, 0),
('Lightning Blade', 6, 200, 2, 4, 3, 0, 0, 0, 0),
('Sharingan Copy', 6, 400, 3, 6, 5, 0, 0, 0, 0),
('Kamui', 6, 800, 4, 9, 8, 4, 0, 0, 0);

-- Deidara abilities (heroTemplateId = 7)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Clay Bomb', 7, 50, 1, 0, 0, 0, 3, 0, 0),
('C2 Dragon', 7, 200, 2, 0, 5, 0, 3, 0, 0),
('C3 Megaton', 7, 400, 3, 0, 8, 0, 6, 0, 0),
('C4 Karura', 7, 800, 4, 0, 12, 0, 10, 0, 0);

-- Minato abilities (heroTemplateId = 8)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Flash Step', 8, 50, 1, 0, 0, 3, 0, 0, 0),
('Rasengan', 8, 200, 2, 5, 0, 4, 0, 0, 0),
('Flying Thunder God', 8, 400, 3, 8, 0, 6, 0, 0, 0),
('Reaper Death Seal', 8, 800, 4, 12, 0, 10, 0, 0, 5);

-- Hashirama abilities (heroTemplateId = 9)
INSERT INTO ability_template (name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) VALUES
('Wood Shield', 9, 50, 1, 0, 0, 0, 0, 0, 3),
('Forest Growth', 9, 200, 2, 0, 5, 0, 0, 0, 4),
('Deep Forest Bloom', 9, 400, 3, 0, 8, 0, 0, 0, 8),
('Sage Art: True Golem', 9, 800, 4, 0, 12, 0, 0, 8, 10);
