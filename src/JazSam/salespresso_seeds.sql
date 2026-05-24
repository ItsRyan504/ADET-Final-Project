-- ============================================================
-- SalesPresso DB — Seed Data
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Staff ────────────────────────────────────────────────────
TRUNCATE TABLE `staff`;
INSERT INTO `staff` (`StaffID`, `S_FirstName`, `S_LastName`, `Role`, `S_PhoneNumber`, `S_Username`, `S_Password`, `S_Email`) VALUES
('STF00000001', 'Admin',   'Santos',  'Admin',   9171234567, 'admin',   '$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PkOmGp/G1GpIBM9rNl5b5aezVsXPKe', 'admin@salespresso.com'),
('STF00000002', 'Maria',   'Reyes',   'Cashier', 9181234567, 'mariares','$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PkOmGp/G1GpIBM9rNl5b5aezVsXPKe', 'maria.reyes@salespresso.com'),
('STF00000003', 'Jose',    'Cruz',    'Barista', 9191234567, 'josecruz','$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PkOmGp/G1GpIBM9rNl5b5aezVsXPKe', 'jose.cruz@salespresso.com');

-- ── Customers ────────────────────────────────────────────────
TRUNCATE TABLE `customer`;
INSERT INTO `customer` (`CustomerID`, `IsRegistered`, `C_Username`, `C_Password`, `C_FirstName`, `C_LastName`, `C_PhoneNumber`, `C_Email`, `C_Birthday`) VALUES
('CST00000001', 'Y', 'janedoe',  '$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PkOmGp/G1GpIBM9rNl5b5aezVsXPKe', 'Jane',  'Doe',     '09171111111', 'jane.doe@email.com',   '1998-03-15'),
('CST00000002', 'Y', 'juandelacruz','$2b$10$EixZaYVK1fsbw1ZfbX3OXe.PkOmGp/G1GpIBM9rNl5b5aezVsXPKe','Juan','dela Cruz','09172222222', 'juan.dc@email.com',    '2000-07-04'),
('CST00000003', 'N', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- ── Products ─────────────────────────────────────────────────
TRUNCATE TABLE `product`;
INSERT INTO `product` (`ProductID`, `ProductName`, `Category`, `IsAvailable`, `ImageURL`) VALUES
('PRD00000001', 'Classic Americano',       'Beverage', 1, 'https://placehold.co/400x300?text=Americano'),
('PRD00000002', 'Iced Caramel Latte',      'Beverage', 1, 'https://placehold.co/400x300?text=IcedLatte'),
('PRD00000003', 'Matcha Milk Tea',         'Beverage', 1, 'https://placehold.co/400x300?text=Matcha'),
('PRD00000004', 'Strawberry Lemonade',     'Beverage', 1, 'https://placehold.co/400x300?text=Lemonade'),
('PRD00000005', 'Mango Shake',             'Beverage', 1, 'https://placehold.co/400x300?text=MangoShake'),
('PRD00000006', 'Cheesecake Slice',        'Food',     1, 'https://placehold.co/400x300?text=Cheesecake'),
('PRD00000007', 'Club Sandwich',           'Food',     1, 'https://placehold.co/400x300?text=ClubSandwich');

-- ── Beverage ─────────────────────────────────────────────────
TRUNCATE TABLE `beverage`;
INSERT INTO `beverage` (`ProductID`, `BeverageType`, `BeverageSubtype`) VALUES
('PRD00000001', 'Hot',  'Coffee'),
('PRD00000002', 'Iced', 'Coffee'),
('PRD00000003', 'Iced', 'Matcha'),
('PRD00000004', 'Iced', 'Lemonade'),
('PRD00000005', 'Iced', 'Milk-based');

-- ── Food ─────────────────────────────────────────────────────
TRUNCATE TABLE `food`;
INSERT INTO `food` (`ProductID`, `FoodType`) VALUES
('PRD00000006', 'Snacks'),
('PRD00000007', 'Meals');

-- ── Product Variants ─────────────────────────────────────────
TRUNCATE TABLE `product_variant`;
-- Americano (Hot) — 8oz / 12oz
INSERT INTO `product_variant` (`VariantID`, `ProductID`, `SizeLabel`, `SizeOz`, `Price`, `IsAvailable`) VALUES
('VAR00000001', 'PRD00000001', NULL, '8oz',  65.00, 1),
('VAR00000002', 'PRD00000001', NULL, '12oz', 85.00, 1),
-- Iced Caramel Latte — 12oz / 16oz / 22oz
('VAR00000003', 'PRD00000002', NULL, '12oz', 100.00, 1),
('VAR00000004', 'PRD00000002', NULL, '16oz', 120.00, 1),
('VAR00000005', 'PRD00000002', NULL, '22oz', 145.00, 1),
-- Matcha Milk Tea — 12oz / 16oz / 22oz
('VAR00000006', 'PRD00000003', NULL, '12oz', 105.00, 1),
('VAR00000007', 'PRD00000003', NULL, '16oz', 125.00, 1),
('VAR00000008', 'PRD00000003', NULL, '22oz', 150.00, 1),
-- Strawberry Lemonade — 16oz / 22oz
('VAR00000009', 'PRD00000004', NULL, '16oz',  95.00, 1),
('VAR00000010', 'PRD00000004', NULL, '22oz', 115.00, 1),
-- Mango Shake — 16oz / 22oz
('VAR00000011', 'PRD00000005', NULL, '16oz', 110.00, 1),
('VAR00000012', 'PRD00000005', NULL, '22oz', 135.00, 1),
-- Cheesecake Slice — Small / Large
('VAR00000013', 'PRD00000006', 'Small', NULL, 80.00,  1),
('VAR00000014', 'PRD00000006', 'Large', NULL, 130.00, 1),
-- Club Sandwich — one size (Medium)
('VAR00000015', 'PRD00000007', 'Medium', NULL, 175.00, 1);

-- ── Ingredients ──────────────────────────────────────────────
TRUNCATE TABLE `ingredients`;
INSERT INTO `ingredients` (`IngredientID`, `IngredientName`, `StockQuantity`, `Unit`, `LowStockThreshold`) VALUES
('ING00000001', 'Espresso Shots',   5000.00, 'ml',   500.00),
('ING00000002', 'Whole Milk',      10000.00, 'ml',  1000.00),
('ING00000003', 'Matcha Powder',    2000.00, 'g',    200.00),
('ING00000004', 'Simple Syrup',     3000.00, 'ml',   300.00),
('ING00000005', 'Caramel Sauce',    2000.00, 'ml',   200.00),
('ING00000006', 'Lemon Juice',      2000.00, 'ml',   200.00),
('ING00000007', 'Strawberry Puree', 2000.00, 'ml',   200.00),
('ING00000008', 'Mango Puree',      3000.00, 'ml',   300.00),
('ING00000009', 'Bread Slices',      100.00, 'pcs',   10.00),
('ING00000010', 'Cheese',           2000.00, 'g',    200.00),
('ING00000011', 'Chicken',          5000.00, 'g',    500.00),
('ING00000012', 'Ice',             20000.00, 'g',   2000.00);

-- ── Product Ingredients (full recipes — all 15 variants) ─────
-- QuantityUsed is per serving in the ingredient's own unit:
--   Espresso Shots → ml  |  Whole Milk → ml  |  Matcha Powder → g
--   Simple Syrup   → ml  |  Caramel Sauce → ml  |  Lemon Juice → ml
--   Strawberry Puree → ml  |  Mango Puree → ml  |  Ice → g
--   Bread Slices → pcs  |  Cheese → g  |  Chicken → g
TRUNCATE TABLE `product_ingredient`;
INSERT INTO `product_ingredient` (`VariantID`, `IngredientID`, `QuantityUsed`) VALUES

-- ── Classic Americano (Hot) ───────────────────────────────────
-- VAR00000001 · 8oz  · ₱65
('VAR00000001', 'ING00000001',  60.00),   -- Espresso Shots  60 ml
('VAR00000001', 'ING00000004',  15.00),   -- Simple Syrup    15 ml
-- VAR00000002 · 12oz · ₱85
('VAR00000002', 'ING00000001',  90.00),   -- Espresso Shots  90 ml
('VAR00000002', 'ING00000004',  20.00),   -- Simple Syrup    20 ml

-- ── Iced Caramel Latte ───────────────────────────────────────
-- VAR00000003 · 12oz · ₱100
('VAR00000003', 'ING00000001',  60.00),   -- Espresso Shots  60 ml
('VAR00000003', 'ING00000002', 150.00),   -- Whole Milk     150 ml
('VAR00000003', 'ING00000005',  20.00),   -- Caramel Sauce   20 ml
('VAR00000003', 'ING00000012', 100.00),   -- Ice            100 g
-- VAR00000004 · 16oz · ₱120
('VAR00000004', 'ING00000001',  90.00),   -- Espresso Shots  90 ml
('VAR00000004', 'ING00000002', 200.00),   -- Whole Milk     200 ml
('VAR00000004', 'ING00000005',  30.00),   -- Caramel Sauce   30 ml
('VAR00000004', 'ING00000012', 150.00),   -- Ice            150 g
-- VAR00000005 · 22oz · ₱145
('VAR00000005', 'ING00000001', 120.00),   -- Espresso Shots 120 ml
('VAR00000005', 'ING00000002', 270.00),   -- Whole Milk     270 ml
('VAR00000005', 'ING00000005',  40.00),   -- Caramel Sauce   40 ml
('VAR00000005', 'ING00000012', 200.00),   -- Ice            200 g

-- ── Matcha Milk Tea ──────────────────────────────────────────
-- VAR00000006 · 12oz · ₱105
('VAR00000006', 'ING00000003',  15.00),   -- Matcha Powder   15 g
('VAR00000006', 'ING00000002', 150.00),   -- Whole Milk     150 ml
('VAR00000006', 'ING00000004',  20.00),   -- Simple Syrup    20 ml
('VAR00000006', 'ING00000012', 100.00),   -- Ice            100 g
-- VAR00000007 · 16oz · ₱125
('VAR00000007', 'ING00000003',  20.00),   -- Matcha Powder   20 g
('VAR00000007', 'ING00000002', 200.00),   -- Whole Milk     200 ml
('VAR00000007', 'ING00000004',  25.00),   -- Simple Syrup    25 ml
('VAR00000007', 'ING00000012', 150.00),   -- Ice            150 g
-- VAR00000008 · 22oz · ₱150
('VAR00000008', 'ING00000003',  25.00),   -- Matcha Powder   25 g
('VAR00000008', 'ING00000002', 270.00),   -- Whole Milk     270 ml
('VAR00000008', 'ING00000004',  35.00),   -- Simple Syrup    35 ml
('VAR00000008', 'ING00000012', 200.00),   -- Ice            200 g

-- ── Strawberry Lemonade ──────────────────────────────────────
-- VAR00000009 · 16oz · ₱95
('VAR00000009', 'ING00000006',  60.00),   -- Lemon Juice     60 ml
('VAR00000009', 'ING00000007',  80.00),   -- Strawberry Puree 80 ml
('VAR00000009', 'ING00000004',  30.00),   -- Simple Syrup    30 ml
('VAR00000009', 'ING00000012', 150.00),   -- Ice            150 g
-- VAR00000010 · 22oz · ₱115
('VAR00000010', 'ING00000006',  80.00),   -- Lemon Juice     80 ml
('VAR00000010', 'ING00000007', 110.00),   -- Strawberry Puree 110 ml
('VAR00000010', 'ING00000004',  40.00),   -- Simple Syrup    40 ml
('VAR00000010', 'ING00000012', 200.00),   -- Ice            200 g

-- ── Mango Shake ──────────────────────────────────────────────
-- VAR00000011 · 16oz · ₱110
('VAR00000011', 'ING00000008', 150.00),   -- Mango Puree    150 ml
('VAR00000011', 'ING00000002', 100.00),   -- Whole Milk     100 ml
('VAR00000011', 'ING00000012', 150.00),   -- Ice            150 g
-- VAR00000012 · 22oz · ₱135
('VAR00000012', 'ING00000008', 200.00),   -- Mango Puree    200 ml
('VAR00000012', 'ING00000002', 130.00),   -- Whole Milk     130 ml
('VAR00000012', 'ING00000012', 200.00),   -- Ice            200 g

-- ── Cheesecake Slice ─────────────────────────────────────────
-- VAR00000013 · Small · ₱80
('VAR00000013', 'ING00000010',  80.00),   -- Cheese          80 g
-- VAR00000014 · Large · ₱130
('VAR00000014', 'ING00000010', 140.00),   -- Cheese         140 g

-- ── Club Sandwich ────────────────────────────────────────────
-- VAR00000015 · Medium · ₱175
('VAR00000015', 'ING00000009',   3.00),   -- Bread Slices     3 pcs
('VAR00000015', 'ING00000010',  50.00),   -- Cheese          50 g
('VAR00000015', 'ING00000011', 120.00);   -- Chicken        120 g

-- ── Stamp Rewards ────────────────────────────────────────────
TRUNCATE TABLE `stamp_reward`;
INSERT INTO `stamp_reward` (`RewardID`, `RewardName`, `RewardType`, `RewardValue`, `StampsRequired`) VALUES
('RWD00000001', '10% Off Your Order',   'Percentage',   10.00, 10),
('RWD00000002', 'Free Small Drink',     'Free Item',     0.00, 10),
('RWD00000003', 'PHP 50 Off',           'Fixed Amount', 50.00, 10);

-- ── Birthday Rewards ─────────────────────────────────────────
TRUNCATE TABLE `birthday_reward`;
INSERT INTO `birthday_reward` (`BirthdayRewardID`, `RewardName`, `RewardType`, `RewardValue`, `IsActive`) VALUES
('BRW00000001', 'Birthday Free Drink',   'Free Item',     0.00, 1),
('BRW00000002', '20% Birthday Discount', 'Percentage',   20.00, 1);

-- ── Carts ────────────────────────────────────────────────────
TRUNCATE TABLE `cart`;
INSERT INTO `cart` (`CartID`, `CustomerID`) VALUES
('CRT00000001', 'CST00000001'),
('CRT00000002', 'CST00000002');

-- ── Orders ───────────────────────────────────────────────────
TRUNCATE TABLE `orders`;
INSERT INTO `orders` (`OrderID`, `CustomerID`, `StaffID`, `RewardID`, `OrderDate`, `OrderStatus`, `FinalAmount`) VALUES
('ORD00000001', 'CST00000001', 'STF00000002', NULL,         '2026-05-01 09:15:00', 'Completed',        205.00),
('ORD00000002', 'CST00000002', 'STF00000002', 'RWD00000001','2026-05-02 10:30:00', 'Completed',        108.00),
('ORD00000003', 'CST00000003', 'STF00000003', NULL,         '2026-05-03 14:00:00', 'Being Prepared',   175.00),
('ORD00000004', 'CST00000001', 'STF00000002', NULL,         '2026-05-10 11:00:00', 'Processing',       120.00);

-- ── Order Items ──────────────────────────────────────────────
TRUNCATE TABLE `order_item`;
INSERT INTO `order_item` (`OrderItemID`, `OrderID`, `VariantID`, `Quantity`, `Subtotal`) VALUES
-- ORD00000001: Iced Latte 16oz x1 + Club Sandwich x1
('OIT00000001', 'ORD00000001', 'VAR00000004', 1, 120.00),
('OIT00000002', 'ORD00000001', 'VAR00000015', 1, 175.00),
-- ORD00000002: Matcha 12oz x1 + Cheesecake Small x1 (10% reward applied)
('OIT00000003', 'ORD00000002', 'VAR00000006', 1, 105.00),
('OIT00000004', 'ORD00000002', 'VAR00000013', 1,  80.00),
-- ORD00000003: Club Sandwich x1
('OIT00000005', 'ORD00000003', 'VAR00000015', 1, 175.00),
-- ORD00000004: Iced Latte 12oz x1
('OIT00000006', 'ORD00000004', 'VAR00000003', 1, 100.00);

-- ── Payments ─────────────────────────────────────────────────
TRUNCATE TABLE `payment`;
INSERT INTO `payment` (`PaymentID`, `OrderID`, `PaymentMethod`, `PaymentStatus`, `AmountPaid`, `TransactionReference`, `PaidAt`) VALUES
('PAY00000001', 'ORD00000001', 'GCash',    'Paid',    205.00, 'GCSH-20260501-001', '2026-05-01 09:17:00'),
('PAY00000002', 'ORD00000002', 'GCash',    'Paid',    108.00, 'GCSH-20260502-001', '2026-05-02 10:32:00'),
('PAY00000003', 'ORD00000003', 'In-store', 'Pending',   0.00, NULL,                NULL),
('PAY00000004', 'ORD00000004', 'GCash',    'Pending',   0.00, NULL,                NULL);

-- ── Stamp Cards ──────────────────────────────────────────────
TRUNCATE TABLE `customer_stamp_card`;
INSERT INTO `customer_stamp_card` (`CardID`, `CustomerID`, `StampsCollected`, `MaxStamps`, `IsActive`) VALUES
('STC00000001', 'CST00000001', 3, 10, 1),
('STC00000002', 'CST00000002', 1, 10, 1);

-- ── Notifications ────────────────────────────────────────────
TRUNCATE TABLE `notification`;
INSERT INTO `notification` (`NotificationID`, `StaffID`, `OrderID`, `Message`, `IsRead`) VALUES
('NTF00000001', 'STF00000003', 'ORD00000003', 'New order received: Club Sandwich x1', 0),
('NTF00000002', 'STF00000002', 'ORD00000004', 'New order received: Iced Caramel Latte x1', 0);

SET FOREIGN_KEY_CHECKS = 1;
