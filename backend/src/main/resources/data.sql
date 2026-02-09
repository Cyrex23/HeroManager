-- Seed Data: HeroManager Core Game System
-- Only insert if tables are empty (prevent duplicates on restart)

-- Hero Templates (9 heroes)
MERGE INTO hero_template (id, name, display_name, image_path, cost, capacity, base_pa, base_mp, base_dex, base_elem, base_mana, base_stam, growth_pa, growth_mp, growth_dex, growth_elem, growth_mana, growth_stam, is_starter) KEY(id) VALUES
(1, 'konohamaru-genin', 'Konohamaru Genin', 'konohamaru-genin.jpg', 0, 5, 5.0, 8.0, 3.0, 2.0, 20.0, 10.0, 0.8, 1.0, 0.2, 0.7, 1.0, 1.0, true),
(2, 'sakura', 'Sakura', 'sakura.gif', 200, 8, 4.0, 12.0, 4.0, 5.0, 30.0, 12.0, 0.5, 1.5, 0.3, 1.0, 1.5, 1.2, false),
(3, 'hidan', 'Hidan', 'hidan.gif', 400, 10, 14.0, 3.0, 5.0, 2.0, 15.0, 18.0, 1.5, 0.3, 0.5, 0.3, 0.8, 1.8, false),
(4, 'konan', 'Konan', 'konan.gif', 400, 10, 6.0, 10.0, 8.0, 6.0, 22.0, 12.0, 0.7, 1.2, 0.8, 0.8, 1.2, 1.0, false),
(5, 'kabuto', 'Kabuto', 'kabuto.gif', 400, 15, 7.0, 14.0, 6.0, 8.0, 28.0, 14.0, 0.8, 1.6, 0.5, 1.2, 1.5, 1.2, false),
(6, 'kakashi', 'Kakashi', 'kakashi.gif', 400, 15, 12.0, 11.0, 9.0, 7.0, 25.0, 15.0, 1.3, 1.3, 0.9, 0.9, 1.3, 1.3, false),
(7, 'deidara', 'Deidara', 'deidara.gif', 400, 20, 8.0, 16.0, 5.0, 12.0, 32.0, 10.0, 0.9, 1.8, 0.4, 1.5, 1.8, 0.8, false),
(8, 'minato', 'Minato', 'minato.gif', 2000, 30, 15.0, 14.0, 14.0, 10.0, 30.0, 20.0, 1.6, 1.5, 1.4, 1.2, 1.5, 1.8, false),
(9, 'hashirama', 'Hashirama', 'hashirama.gif', 2000, 30, 16.0, 16.0, 8.0, 12.0, 35.0, 22.0, 1.7, 1.7, 0.8, 1.4, 2.0, 2.0, false);

-- Summon Templates (1 summon)
MERGE INTO summon_template (id, name, display_name, image_path, cost, capacity, base_mana, base_mp, growth_mana, growth_mp) KEY(id) VALUES
(1, 'susanoo-spirit-summon', 'Susanoo Spirit Summon', 'susanoo-spirit-summon.jpg', 300, 15, 10.0, 5.0, 5.0, 4.0);

-- Item Templates (10 items)
MERGE INTO item_template (id, name, cost, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) KEY(id) VALUES
(1, 'Training Weights', 100, 3.0, 0.0, 0.0, 0.0, 0.0, 0.0),
(2, 'Iron Kunai', 100, 2.0, 0.0, 1.0, 0.0, 0.0, 0.0),
(3, 'Chakra Scroll', 100, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0),
(4, 'Mana Crystal', 100, 0.0, 0.0, 0.0, 0.0, 5.0, 0.0),
(5, 'Swift Boots', 100, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0),
(6, 'Warrior Armor', 300, 6.0, 0.0, 0.0, 0.0, 0.0, 4.0),
(7, 'Mystic Tome', 300, 0.0, 6.0, 0.0, 0.0, 8.0, 0.0),
(8, 'Shadow Cloak', 300, 0.0, 0.0, 5.0, 0.0, 0.0, 3.0),
(9, 'Legendary Blade', 600, 12.0, 0.0, 5.0, 0.0, 0.0, 0.0),
(10, 'Sage Staff', 600, 0.0, 12.0, 0.0, 0.0, 12.0, 0.0);

-- Ability Templates (36 abilities: 4 per hero)
-- Konohamaru-Genin (heroTemplateId = 1)
MERGE INTO ability_template (id, name, hero_template_id, cost, tier, bonus_pa, bonus_mp, bonus_dex, bonus_elem, bonus_mana, bonus_stam) KEY(id) VALUES
(1, 'Konohamaru Ability 1', 1, 50, 1, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0),
(2, 'Konohamaru Ability 2', 1, 200, 2, 0.0, 3.0, 2.0, 0.0, 0.0, 0.0),
(3, 'Konohamaru Ability 3', 1, 400, 3, 5.0, 0.0, 0.0, 0.0, 0.0, 3.0),
(4, 'Konohamaru Ability 4', 1, 800, 4, 0.0, 8.0, 0.0, 0.0, 5.0, 0.0),
-- Sakura (heroTemplateId = 2)
(5, 'Sakura Ability 1', 2, 50, 1, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0),
(6, 'Sakura Ability 2', 2, 200, 2, 0.0, 2.0, 0.0, 0.0, 5.0, 0.0),
(7, 'Sakura Ability 3', 2, 400, 3, 0.0, 6.0, 0.0, 0.0, 0.0, 4.0),
(8, 'Sakura Ability 4', 2, 800, 4, 0.0, 10.0, 0.0, 0.0, 8.0, 0.0),
-- Hidan (heroTemplateId = 3)
(9, 'Hidan Ability 1', 3, 50, 1, 3.0, 0.0, 0.0, 0.0, 0.0, 0.0),
(10, 'Hidan Ability 2', 3, 200, 2, 4.0, 0.0, 0.0, 0.0, 0.0, 3.0),
(11, 'Hidan Ability 3', 3, 400, 3, 8.0, 0.0, 2.0, 0.0, 0.0, 0.0),
(12, 'Hidan Ability 4', 3, 800, 4, 12.0, 0.0, 0.0, 0.0, 0.0, 6.0),
-- Konan (heroTemplateId = 4)
(13, 'Konan Ability 1', 4, 50, 1, 0.0, 0.0, 2.0, 0.0, 0.0, 0.0),
(14, 'Konan Ability 2', 4, 200, 2, 0.0, 3.0, 3.0, 0.0, 0.0, 0.0),
(15, 'Konan Ability 3', 4, 400, 3, 0.0, 5.0, 5.0, 0.0, 0.0, 0.0),
(16, 'Konan Ability 4', 4, 800, 4, 0.0, 8.0, 6.0, 0.0, 0.0, 4.0),
-- Kabuto (heroTemplateId = 5)
(17, 'Kabuto Ability 1', 5, 50, 1, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0),
(18, 'Kabuto Ability 2', 5, 200, 2, 0.0, 4.0, 0.0, 3.0, 0.0, 0.0),
(19, 'Kabuto Ability 3', 5, 400, 3, 0.0, 7.0, 0.0, 0.0, 5.0, 0.0),
(20, 'Kabuto Ability 4', 5, 800, 4, 0.0, 10.0, 0.0, 8.0, 0.0, 0.0),
-- Kakashi (heroTemplateId = 6)
(21, 'Kakashi Ability 1', 6, 50, 1, 2.0, 0.0, 1.0, 0.0, 0.0, 0.0),
(22, 'Kakashi Ability 2', 6, 200, 2, 4.0, 3.0, 0.0, 0.0, 0.0, 0.0),
(23, 'Kakashi Ability 3', 6, 400, 3, 6.0, 5.0, 0.0, 0.0, 0.0, 0.0),
(24, 'Kakashi Ability 4', 6, 800, 4, 9.0, 8.0, 4.0, 0.0, 0.0, 0.0),
-- Deidara (heroTemplateId = 7)
(25, 'Deidara Ability 1', 7, 50, 1, 0.0, 0.0, 0.0, 3.0, 0.0, 0.0),
(26, 'Deidara Ability 2', 7, 200, 2, 0.0, 5.0, 0.0, 3.0, 0.0, 0.0),
(27, 'Deidara Ability 3', 7, 400, 3, 0.0, 8.0, 0.0, 6.0, 0.0, 0.0),
(28, 'Deidara Ability 4', 7, 800, 4, 0.0, 12.0, 0.0, 10.0, 0.0, 0.0),
-- Minato (heroTemplateId = 8)
(29, 'Minato Ability 1', 8, 50, 1, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0),
(30, 'Minato Ability 2', 8, 200, 2, 5.0, 0.0, 4.0, 0.0, 0.0, 0.0),
(31, 'Minato Ability 3', 8, 400, 3, 8.0, 0.0, 6.0, 0.0, 0.0, 0.0),
(32, 'Minato Ability 4', 8, 800, 4, 12.0, 0.0, 10.0, 0.0, 0.0, 5.0),
-- Hashirama (heroTemplateId = 9)
(33, 'Hashirama Ability 1', 9, 50, 1, 0.0, 0.0, 0.0, 0.0, 0.0, 3.0),
(34, 'Hashirama Ability 2', 9, 200, 2, 0.0, 5.0, 0.0, 0.0, 0.0, 4.0),
(35, 'Hashirama Ability 3', 9, 400, 3, 0.0, 8.0, 0.0, 0.0, 0.0, 8.0),
(36, 'Hashirama Ability 4', 9, 800, 4, 0.0, 12.0, 0.0, 0.0, 8.0, 10.0);
