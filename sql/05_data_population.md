-- ==========================================
-- Tu Tiên Ký: 05 - Data Population
-- ==========================================
USE `tu_tien_db`;

-- Disable foreign key checks to allow truncating tables in any order for reset purposes
SET FOREIGN_KEY_CHECKS=0;

-- Truncate all data tables to ensure a clean slate
TRUNCATE TABLE `recipes`;
TRUNCATE TABLE `pills`;
TRUNCATE TABLE `herbs`;
TRUNCATE TABLE `realms`;
TRUNCATE TABLE `spiritual_roots`;
TRUNCATE TABLE `techniques`;
TRUNCATE TABLE `equipment`;
TRUNCATE TABLE `insights`;
TRUNCATE TABLE `exploration_locations`;
TRUNCATE TABLE `trial_zones`;
TRUNCATE TABLE `honor_shop_items`;
TRUNCATE TABLE `pvp_skills`;
TRUNCATE TABLE `game_config`;
TRUNCATE TABLE `combat_log_templates`;
TRUNCATE TABLE `rarities`;
TRUNCATE TABLE `breakthrough_failure_bonuses`;
TRUNCATE TABLE `css_animations`;
TRUNCATE TABLE `avatars`;
TRUNCATE TABLE `equipment_upgrades`;
TRUNCATE TABLE `pvp_daily_rewards`;
TRUNCATE TABLE `pvp_weekly_rewards`;


-- Insert Rarities Data
INSERT INTO `rarities` (`id`, `name`, `style`) VALUES
('common', 'Phàm Phẩm', '{"css": "#a1a1aa"}'),
('uncommon', 'Linh Phẩm', '{"css": "#4ade80"}'),
('rare', 'Pháp Khí', '{"css": "#60a5fa"}'),
('epic', 'Pháp Bảo', '{"css": "linear-gradient(to right, #c084fc, #a855f7)"}'),
('legendary', 'Tiên Khí', '{"css": "linear-gradient(to right, #f59e0b, #facc15, #fde047, #f59e0b)", "animation": "animate-rainbow-text"}');

-- NEW: Insert Avatars Data
INSERT INTO `avatars` (`id`, `name`, `url`, `description`) VALUES
('default_male_1', 'Nam Mặc Định', 'https://res.cloudinary.com/dorlio3ic/image/upload/v1756894940/1_wn0ouy.svg', 'Avatar mặc định cho nam tu sĩ.');

-- NEW: Insert Equipment Upgrades Data
INSERT INTO `equipment_upgrades` (`upgrade_level`, `required_dust`, `success_chance`, `stat_multiplier`) VALUES
(1, 10, 1.0, 1.1),
(2, 20, 1.0, 1.2),
(3, 40, 0.9, 1.3),
(4, 80, 0.8, 1.45),
(5, 150, 0.7, 1.6),
(6, 300, 0.6, 1.8),
(7, 500, 0.5, 2.0),
(8, 800, 0.4, 2.25),
(9, 1200, 0.3, 2.5),
(10, 2000, 0.2, 3.0);


-- Insert data into tables
INSERT INTO `realms` (`realmIndex`, `name`, `qiThreshold`, `baseQiPerSecond`, `breakthroughChance`, `baseHp`, `baseAtk`, `baseDef`, `baseSpeed`, `baseCritRate`, `baseCritDamage`, `baseDodgeRate`, `baseHitRate`, `baseCritResist`, `baseLifestealResist`, `baseCounterResist`) VALUES
(0, 'Phàm Nhân', 100, 1, 1, 50, 5, 0, 10, 0.05, 1.5, 0.01, 0.0, 0.0, 0.0, 0.0),
(1, 'Luyện Khí Kỳ', 1000, 5, 0.9, 200, 15, 5, 12, 0.05, 1.5, 0.02, 0.01, 0.01, 0.0, 0.0),
(2, 'Trúc Cơ Kỳ', 10000, 25, 0.75, 1000, 50, 20, 15, 0.06, 1.55, 0.03, 0.02, 0.015, 0.01, 0.01),
(3, 'Kim Đan Kỳ', 100000, 125, 0.6, 5000, 200, 80, 20, 0.07, 1.6, 0.04, 0.03, 0.02, 0.015, 0.015),
(4, 'Nguyên Anh Kỳ', 1000000, 625, 0.45, 25000, 800, 300, 25, 0.08, 1.65, 0.05, 0.04, 0.025, 0.02, 0.02),
(5, 'Hóa Thần Kỳ', 10000000, 3125, 0.3, 125000, 3500, 1200, 35, 0.1, 1.75, 0.06, 0.05, 0.03, 0.025, 0.025),
(6, 'Luyện Hư Kỳ', 100000000, 15625, 0.15, 600000, 15000, 5000, 50, 0.12, 1.9, 0.08, 0.06, 0.04, 0.03, 0.03),
(7, 'Đại Thừa Kỳ', 9007199254740991, 78125, 0.05, 3000000, 75000, 25000, 70, 0.15, 2.2, 0.1, 0.08, 0.05, 0.04, 0.04);

INSERT INTO `spiritual_roots` (`id`, `name`, `description`, `bonus`) VALUES
('kim', 'Kim Linh Căn', 'Thân thể cứng như kim loại, tăng 15% Phòng Ngự.', '[{"type": "def_mul", "value": 1.15}]'),
('moc', 'Mộc Linh Căn', 'Thân với thảo mộc, tăng 5% tỷ lệ thành công Luyện Đan và 10% sản lượng Thám Hiểm.', '[{"type": "alchemy_success_add", "value": 0.05}, {"type": "exploration_yield_mul", "value": 1.1}]'),
('thuy', 'Thủy Linh Căn', 'Tâm tĩnh như nước, tốc độ hấp thụ linh khí căn bản tăng 0.5 điểm mỗi giây.', '[{"type": "qi_per_second_base_add", "value": 0.5}]'),
('hoa', 'Hỏa Linh Căn', 'Tính nóng như lửa, tăng 10% Công Kích.', '[{"type": "atk_mul", "value": 1.1}]'),
('tho', 'Thổ Linh Căn', 'Vững như bàn thạch, tăng 15% Sinh Lực.', '[{"type": "hp_mul", "value": 1.15}]');

INSERT INTO `herbs` (`id`, `name`, `description`) VALUES
('linh_thao', 'Linh Thảo', 'Loại cỏ dại phổ biến, chứa một ít linh khí.'),
('huyet_tham', 'Huyết Sâm', 'Loại sâm quý mọc ở nơi âm khí nặng, có tác dụng bổ khí huyết.'),
('tinh_nguyet_hoa', 'Tinh Nguyệt Hoa', 'Bông hoa chỉ nở vào đêm trăng tròn, hấp thụ tinh hoa của trời đất.');

INSERT INTO `pills` (`id`, `name`, `description`, `effect`, `rarity`) VALUES
('hoi_khi_dan', 'Hồi Khí Đan', 'Đan dược cấp thấp, có thể ngay lập tức bổ sung một lượng nhỏ linh khí.', '[{"type": "instant_qi", "amount": 500}]', 'common'),
('tinh_nguyen_dan', 'Tinh Nguyên Đan', 'Đan dược trung cấp, luyện hóa từ tinh hoa linh thảo, bổ sung lượng lớn linh khí.', '[{"type": "instant_qi", "amount": 10000}]', 'uncommon'),
('chien_than_dan', 'Chiến Thần Đan', 'Đan dược đặc biệt, dùng trước khi Đấu Pháp sẽ tăng 20% sát thương trong trận đấu tiếp theo.', '[{"type": "atk_mul_buff", "value": 1.2, "duration_attempts": 1, "consumption_trigger": "on_pvp_fight"}]', 'rare'),
('cuong_bao_dan', 'Cuồng Bạo Đan', 'Đan dược khiến người dùng rơi vào trạng thái cuồng bạo, tăng mạnh tỷ lệ bạo kích trong một khoảng thời gian ngắn.', '[{"type": "crit_rate_add_buff", "value": 0.1, "duration_seconds": 300}]', 'rare'),
('than_toc_dan', 'Thần Tốc Đan', 'Đan dược giúp khai thông kinh mạch, tăng mạnh tốc độ hấp thu linh khí trong một khoảng thời gian.', '[{"type": "qi_per_second_multiplier_buff", "value": 1.5, "duration_seconds": 600}]', 'rare');

INSERT INTO `recipes` (`id`, `pillId`, `name`, `description`, `requiredRealmIndex`, `qiCost`, `herbCosts`, `successChance`) VALUES
('recipe_hoi_khi_dan', 'hoi_khi_dan', 'Đan Phương: Hồi Khí Đan', 'Một phương pháp luyện đan đơn giản, phổ biến trong giới tu tiên Luyện Khí Kỳ.', 1, 100, '{"linh_thao": 5}', 0.8),
('recipe_tinh_nguyen_dan', 'tinh_nguyen_dan', 'Đan Phương: Tinh Nguyên Đan', 'Đan phương phức tạp hơn, yêu cầu tu vi Trúc Cơ Kỳ để có thể khống hỏa luyện chế.', 2, 2000, '{"huyet_tham": 3, "tinh_nguyet_hoa": 1}', 0.6),
('recipe_cuong_bao_dan', 'cuong_bao_dan', 'Đan Phương: Cuồng Bạo Đan', 'Phương thuốc cổ xưa, kích phát tiềm năng chiến đấu.', 3, 5000, '{"huyet_tham": 5, "tinh_nguyet_hoa": 2}', 0.5),
('recipe_than_toc_dan', 'than_toc_dan', 'Đan Phương: Thần Tốc Đan', 'Phương thuốc giúp tu sĩ đẩy nhanh tiến độ tu luyện.', 3, 8000, '{"linh_thao": 10, "tinh_nguyet_hoa": 3}', 0.45);

INSERT INTO `techniques` (`id`, `name`, `description`, `requiredRealmIndex`, `bonuses`) VALUES
('dan_khi_quyet', 'Dẫn Khí Quyết', 'Công pháp nhập môn, giúp tăng tốc độ hấp thụ linh khí cơ bản.', 1, '[{"type": "qi_per_second_multiplier", "value": 1.2}]'),
('ngung_than_thuat', 'Ngưng Thần Thuật', 'Ổn định tâm cảnh, giúp tăng nhẹ khả năng thành công khi đột phá.', 2, '[{"type": "breakthrough_chance_add", "value": 0.05}]'),
('hon_nguyen_cong', 'Hỗn Nguyên Công', 'Công pháp thượng thừa, tăng mạnh tốc độ tu luyện nhưng khiến linh khí không ổn định, giảm nhẹ tỷ lệ đột phá.', 3, '[{"type": "qi_per_second_multiplier", "value": 1.5}, {"type": "breakthrough_chance_add", "value": -0.05}]'),
('van_kiem_quyet', 'Vạn Kiếm Quyết', 'Lấy kiếm ý rèn luyện tâm ma, tăng mạnh hiệu suất tu luyện và khả năng đột phá.', 4, '[{"type": "qi_per_second_multiplier", "value": 1.3}, {"type": "breakthrough_chance_add", "value": 0.1}]');

INSERT INTO `equipment` (`id`, `name`, `description`, `slot`, `bonuses`, `rarity`, `smelt_yield`) VALUES
('huyen_thiet_kiem', 'Huyền Thiết Kiếm', 'Một thanh trọng kiếm đơn giản nhưng đầy uy lực.', 'weapon', '[{"type": "atk_add", "value": 100}]', 'uncommon', 10),
('tu_linh_chau', 'Tụ Linh Châu', 'Một viên châu có khả năng tụ tập linh khí trời đất, giúp tăng tốc độ tu luyện.', 'accessory', '[{"type": "qi_per_second_multiplier", "value": 1.1}]', 'rare', 25),
('ho_than_phu', 'Hộ Thân Phù', 'Lá bùa hộ mệnh, tăng cường sinh lực cho người mang nó khi chiến đấu.', 'accessory', '[{"type": "hp_add", "value": 500}]', 'rare', 25),
('pha_quan_giap', 'Phá Quân Giáp', 'Chiến giáp được rèn từ máu của vạn quân địch, tăng 10% công và 10% thủ khi Đấu Pháp.', 'armor', '[{"type": "atk_mul", "value": 1.1}, {"type": "def_mul", "value": 1.1}]', 'epic', 50);

INSERT INTO `insights` (`id`, `name`, `description`, `cost`, `requiredInsightIds`, `bonus`) VALUES
('basic_understanding', 'Sơ Khuy Môn Kính', 'Bước đầu lĩnh ngộ thiên địa, tăng nhẹ tốc độ hấp thụ linh khí cơ bản.', 1, '[]', '{"type": "qi_per_second_base_add", "value": 0.2}'),
('body_harmony', 'Nhục Thân Tương Hợp', 'Hiểu rõ hơn về cơ thể, tăng nhẹ hiệu quả của việc tôi luyện thân thể.', 3, '["basic_understanding"]', '{"type": "body_temper_eff_add", "value": 0.05}'),
('alchemy_intuition', 'Đan Đạo Trực Giác', 'Tâm thần hợp nhất với đan lô, tăng nhẹ tỷ lệ thành công khi luyện đan.', 3, '["basic_understanding"]', '{"type": "alchemy_success_base_add", "value": 0.02}');

INSERT INTO `exploration_locations` (`id`, `name`, `description`, `requiredRealmIndex`, `requiredBodyStrength`, `durationSeconds`, `rewards`) VALUES
('thanh_son_mach', 'Thanh Sơn Mạch', 'Dãy núi gần nhất, linh khí tuy mỏng manh nhưng an toàn cho người mới tu luyện.', 1, 0, 60, '[{"type": "herb", "herbId": "linh_thao", "amount": 3, "chance": 1.0}]'),
('hac_phong_son', 'Hắc Phong Sơn', 'Nơi yêu thú cấp thấp hoành hành, có cơ duyên nhưng cũng đầy rẫy nguy hiểm.', 2, 10, 300, '[{"type": "herb", "herbId": "linh_thao", "amount": 5, "chance": 1.0}, {"type": "herb", "herbId": "huyet_tham", "amount": 1, "chance": 0.5}]'),
('u_vu_dam', 'U Vụ Đầm Lầy', 'Đầm lầy chướng khí, nghe đồn có linh thảo hiếm nhưng rất khó tìm.', 3, 50, 900, '[{"type": "herb", "herbId": "huyet_tham", "amount": 3, "chance": 0.8}, {"type": "herb", "herbId": "tinh_nguyet_hoa", "amount": 1, "chance": 0.3}, {"type": "equipment", "equipmentId": "huyen_thiet_kiem", "chance": 0.01}]');

INSERT INTO `trial_zones` (`id`, `name`, `description`, `requiredRealmIndex`, `cooldownSeconds`, `monster`, `rewards`, `type`) VALUES
('van_thu_coc', 'Vạn Thú Cốc', 'Nơi tập trung của các yêu thú cấp thấp, thích hợp cho tu sĩ Luyện Khí Kỳ rèn luyện.', 1, 60, '[{"name": "Yêu Hổ", "health": 200, "attack": 10}]', '[{"type": "qi", "amount": 50, "chance": 1.0}, {"type": "herb", "herbId": "linh_thao", "amount": 1, "chance": 0.7}, {"type": "linh_thach", "amount": 10, "chance": 1.0}]', 'NORMAL'),
('hac_phong_trai', 'Hắc Phong Trại (Trảm Yêu)', 'Một nhóm tán tu chiếm núi làm vua, hãy tiêu diệt chúng để tích lũy công đức.', 2, 180, '[{"name": "Tặc Đầu", "health": 1500, "attack": 50}]', '[{"type": "qi", "amount": 200, "chance": 1.0}, {"type": "herb", "herbId": "huyet_tham", "amount": 1, "chance": 0.3}, {"type": "linh_thach", "amount": 50, "chance": 1.0}, {"type": "merit", "amount": 2, "chance": 1.0}]', 'MERIT'),
('kiem_mo', 'Kiếm Mộ', 'Nơi chôn cất của vô số kiếm tu, kiếm ý còn sót lại hóa thành ma linh.', 3, 600, '[{"name": "Kiếm Hồn", "health": 10000, "attack": 250}]', '[{"type": "qi", "amount": 2500, "chance": 1.0}, {"type": "herb", "herbId": "tinh_nguyet_hoa", "amount": 1, "chance": 0.2}, {"type": "equipment", "equipmentId": "tu_linh_chau", "chance": 0.05}, {"type": "linh_thach", "amount": 200, "chance": 1.0}]', 'NORMAL');

INSERT INTO `honor_shop_items` (`id`, `type`, `itemId`, `name`, `description`, `cost`, `isUnique`) VALUES
('honor_equipment_1', 'equipment', 'pha_quan_giap', 'Phá Quân Giáp', 'Trang bị PvP, tăng 10% công và thủ khi Đấu Pháp. (Mua một lần)', 50, 1),
('honor_pill_1', 'pill', 'chien_than_dan', 'Chiến Thần Đan', 'Tăng 20% sát thương trong trận Đấu Pháp tiếp theo.', 5, 0);

INSERT INTO `pvp_skills` (`id`, `name`, `description`, `cost`, `energy_cost`, `effect`) VALUES
('no_long_cuoc', 'Nộ Long Cước', 'Tung một cước chứa đầy Sát Khí, gây 150% sát thương và bỏ qua 10% phòng ngự của đối thủ.', 10, 40, '[{"type": "damage", "multiplier": 1.5, "armor_pierce": 0.1}]'),
('kim_cang_ho_the', 'Kim Cang Hộ Thể', 'Vận khởi kim quang hộ thân, tạo một lá chắn bằng 20% máu tối đa của bạn trong 2 lượt.', 15, 50, '[{"type": "shield", "hp_percent": 0.2, "duration": 2}]'),
('huyet_chu', 'Huyết Chú', 'Gây một lượng nhỏ sát thương ban đầu và khiến đối thủ trúng độc, mất máu trong 3 lượt.', 20, 35, '[{"type": "dot", "initial_damage_percent": 0.2, "dot_damage_percent": 0.1, "duration": 3}]');

INSERT INTO `game_config` (`config_key`, `config_value`) VALUES
('BODY_STRENGTH_COST', '{"base": 100, "multiplier": 1.1}'),
('GUILD_CREATION_COST', '[{"type": "linh_thach", "amount": 100000}]'),
('PVP_COOLDOWN_SECONDS', '{"value": 300}'),
('MARKET_TAX_RATE', '{"value": 0.05}'),
('MARKET_LISTING_DURATION_HOURS', '{"value": 24}'),
('KARMA_EFFECTS', '[{"threshold": 50, "type": "atk_mul", "value": 1.05}]'),
('MERIT_EFFECTS', '[{"threshold": 50, "type": "hp_mul", "value": 1.05}]'),
('PUNISHMENT_EFFECT', '{"type": "realm_drop", "value": 1}'),
('PUNISHMENT_KARMA_SCALING', '{"rate_per_point": 0.0001}'),
('BREAKTHROUGH_MERIT_SCALING', '{"bonus_per_point": 0.0001}'),
('MERIT_KARMA_OFFSET_RATE', '{"value": 5}'),
('TECHNIQUE_SWITCH_COOLDOWN_SECONDS', '{"value": 60}'),
('OFFLINE_QI_GAIN_RATE', '{"value": 0.5}'),
('PVP_REALM_SCALING_FACTOR', '{"value": 2}'),
('PVP_QI_LOSS_ON_DEFEAT_PERCENT', '{"value": 0.05}');

INSERT INTO `combat_log_templates` (`type`, `template`) VALUES
('NORMAL_HIT', '{attacker} tấn công, gây {damage} sát thương cho {defender}.'),
('NORMAL_HIT', '{attacker} tung một cú đấm thẳng vào mặt {defender}, gây {damage} sát thương.'),
('NORMAL_HIT', '{attacker} vận một luồng kình khí đánh tới {defender}, gây {damage} sát thương.'),
('CRITICAL_HIT', '{attacker} xuất chiêu CHÍ Mạng, gây {damage} sát thương khủng khiếp lên {defender}!'),
('CRITICAL_HIT', 'Một đòn hiểm hóc! {attacker} đánh trúng yếu huyệt của {defender}, gây {damage} sát thương BẠO KÍCH!'),
('CRITICAL_HIT', '{attacker} hét lớn, dồn toàn lực vào một đòn, gây {damage} sát thương CHÍ MẠNG!'),
('DODGE', '{defender} thân pháp ảo diệu, đã NÉ TRÁNH đòn tấn công của {attacker}!'),
('DODGE', '{attacker} ra đòn nhưng chỉ đánh trúng tàn ảnh của {defender}!'),
('SHIELD_ABSORB', 'Khiên của {defender} hấp thụ {damage} sát thương từ đòn tấn công của {attacker}.'),
('LIFESTEAL', 'Đòn đánh của {attacker} mang theo Hấp Huyết, hồi lại {healed} sinh lực.'),
('COUNTER_ATTACK', '{attacker} chưa kịp thu chiêu đã bị {defender} PHẢN ĐÒN, nhận {damage} sát thương!'),
('SKILL_DAMAGE', '{attacker} vận khởi tuyệt kỹ [{skillName}], gây {damage} sát thương lên {defender}!'),
('SKILL_EFFECT', '{attacker} thi triển [{skillName}], một hiệu ứng đặc biệt bao phủ chiến trường!'),
('INFO', '{text}'),
('ATTACKER_FINISHER', 'Bằng một đòn toàn lực, {attacker} hét ''Game là dễ!'', tiễn {defender} về thành dưỡng sức.'),
('ATTACKER_FINISHER', '{attacker} tung ra tuyệt kỹ cuối cùng, {defender} không kịp ngáp đã nằm sõng soài trên đất.'),
('ATTACKER_FINISHER', 'Một đòn kết liễu đẹp mắt! {attacker} phủi tay và nói: ''Trìnhแค่นี้ đòi solo với anh à?'''),
('DEFENDER_FINISHER', 'Trong lúc {attacker} đang mải múa may, {defender} tung một đòn chí mạng, kết liễu trận đấu!'),
('DEFENDER_FINISHER', '{defender} lật kèo ngoạn mục! {attacker} không hiểu chuyện gì vừa xảy ra.'),
('PVP_WIN_SUMMARY', 'Đối thủ của {defender} chỉ là con gà. Gáy lên đi chứ!'),
('PVP_WIN_SUMMARY', '{attacker} ra tay quá nặng, {defender} khóc thét bỏ chạy về mách mẹ.'),
('PVP_WIN_SUMMARY', 'Một quyền tung ra, trời long đất lở. {defender} chỉ biết quỳ xuống gọi {attacker} là ''bố''.'),
('PVP_LOSE_SUMMARY', '{attacker} đã bị vả cho lệch mồm, may mà chưa rụng cái răng nào.'),
('PVP_LOSE_SUMMARY', '{defender} quá mạnh, {attacker} bị hành cho ra bã như tương Bần.'),
('PVP_LOSE_SUMMARY', '{attacker} đã cố hết sức, nhưng núi cao còn có núi cao hơn, và {attacker} thì ở dưới đáy.');

INSERT INTO `breakthrough_failure_bonuses` (`failure_count`, `description`, `bonuses`) VALUES
(1, 'Phúc lợi lần 1', '[{"type": "breakthrough_chance_add", "value": 0.02}]'),
(3, 'Phúc lợi lần 3', '[{"type": "breakthrough_chance_add", "value": 0.05}]'),
(5, 'Phúc lợi lần 5', '[{"type": "breakthrough_chance_add", "value": 0.1}]');

INSERT INTO `css_animations` (`class_name`, `keyframes_css`) VALUES
('animate-rainbow-text', '@keyframes rainbow-text-animation {\n  0% { background-position: 0% 50%; }\n  50% { background-position: 100% 50%; }\n  100% { background-position: 0% 50%; }\n}\n.animate-rainbow-text {\n  background-size: 200% 200%;\n  animation: rainbow-text-animation 5s ease infinite;\n}');

-- NEW: Default PvP Rewards
INSERT INTO `pvp_daily_rewards` (`rank_start`, `rank_end`, `rewards`) VALUES
(1, 1, '[{"type": "linh_thach", "amount": 1000}, {"type": "honor_points", "amount": 100}]'),
(2, 3, '[{"type": "linh_thach", "amount": 500}, {"type": "honor_points", "amount": 50}]'),
(4, 10, '[{"type": "linh_thach", "amount": 200}, {"type": "honor_points", "amount": 20}]');

INSERT INTO `pvp_weekly_rewards` (`rank_start`, `rank_end`, `rewards`) VALUES
(1, 1, '[{"type": "linh_thach", "amount": 5000}, {"type": "avatar", "avatarId": "default_male_1"}]');


-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;

-- ==========================================
-- END OF SCRIPT
-- ==========================================