-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: salespresso_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `beverage`
--

DROP TABLE IF EXISTS `beverage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `beverage` (
  `ProductID` varchar(12) NOT NULL,
  `BeverageType` enum('Hot','Iced') NOT NULL,
  `BeverageSubtype` enum('Coffee','Mocktails','Fruit Soda','Milk-based','Matcha','Lemonade') NOT NULL,
  PRIMARY KEY (`ProductID`),
  CONSTRAINT `fk_beverage_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `beverage`
--

LOCK TABLES `beverage` WRITE;
/*!40000 ALTER TABLE `beverage` DISABLE KEYS */;
/*!40000 ALTER TABLE `beverage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `birthday_reward`
--

DROP TABLE IF EXISTS `birthday_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `birthday_reward` (
  `BirthdayRewardID` varchar(12) NOT NULL,
  `RewardName` varchar(150) NOT NULL,
  `RewardType` enum('Free Item','Percentage','Fixed Amount') NOT NULL,
  `RewardValue` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Monetary value or percentage; ignored for Free Item type',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Only active rewards are offered to customers on their birthday',
  PRIMARY KEY (`BirthdayRewardID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `birthday_reward`
--

LOCK TABLES `birthday_reward` WRITE;
/*!40000 ALTER TABLE `birthday_reward` DISABLE KEYS */;
/*!40000 ALTER TABLE `birthday_reward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `CartID` varchar(12) NOT NULL,
  `CustomerID` varchar(12) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CartID`),
  UNIQUE KEY `CustomerID_UNIQUE` (`CustomerID`),
  CONSTRAINT `fk_cart_customer` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `CartItemID` varchar(12) NOT NULL,
  `CartID` varchar(12) NOT NULL,
  `VariantID` varchar(12) NOT NULL,
  `Quantity` int NOT NULL DEFAULT '1',
  `AddedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`CartItemID`),
  KEY `CartID_idx` (`CartID`),
  KEY `VariantID_idx` (`VariantID`),
  CONSTRAINT `fk_cartitem_cart` FOREIGN KEY (`CartID`) REFERENCES `cart` (`CartID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cartitem_variant` FOREIGN KEY (`VariantID`) REFERENCES `product_variant` (`VariantID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `CustomerID` varchar(12) NOT NULL,
  `IsRegistered` enum('Y','N') NOT NULL DEFAULT 'N' COMMENT 'Y = registered account (requires ID verification); N = walk-in (verified by order/receipt ID only)',
  `C_Username` varchar(50) DEFAULT NULL,
  `C_Password` varchar(100) DEFAULT NULL,
  `C_FirstName` varchar(50) DEFAULT NULL,
  `C_LastName` varchar(50) DEFAULT NULL,
  `C_PhoneNumber` varchar(20) DEFAULT NULL,
  `C_Email` varchar(200) DEFAULT NULL,
  `C_Birthday` date DEFAULT NULL COMMENT 'Used to determine birthday reward eligibility; NULL for walk-in customers',
  PRIMARY KEY (`CustomerID`),
  UNIQUE KEY `Username_UNIQUE` (`C_Username`),
  UNIQUE KEY `C_Email_UNIQUE` (`C_Email`),
  CONSTRAINT `chk_registered_fields` CHECK (((`IsRegistered` = _utf8mb3'N') or ((`C_Username` is not null) and (`C_Password` is not null) and (`C_FirstName` is not null) and (`C_LastName` is not null) and (`C_PhoneNumber` is not null) and (`C_Email` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_birthday_reward`
--

DROP TABLE IF EXISTS `customer_birthday_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_birthday_reward` (
  `ClaimID` varchar(12) NOT NULL,
  `CustomerID` varchar(12) NOT NULL,
  `BirthdayRewardID` varchar(12) NOT NULL,
  `ClaimedYear` year NOT NULL COMMENT 'The calendar year in which this birthday reward was claimed',
  `ClaimedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ClaimID`),
  UNIQUE KEY `uq_birthday_claim_per_year` (`CustomerID`,`ClaimedYear`) COMMENT 'Prevents a customer from claiming the birthday reward more than once per year',
  KEY `BirthdayRewardID_idx` (`BirthdayRewardID`),
  CONSTRAINT `fk_bdayclaim_customer` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bdayclaim_reward` FOREIGN KEY (`BirthdayRewardID`) REFERENCES `birthday_reward` (`BirthdayRewardID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_birthday_reward`
--

LOCK TABLES `customer_birthday_reward` WRITE;
/*!40000 ALTER TABLE `customer_birthday_reward` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_birthday_reward` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_birthday_reward_claim_insert` BEFORE INSERT ON `customer_birthday_reward` FOR EACH ROW BEGIN
  DECLARE v_is_registered  enum('Y','N');
  DECLARE v_birthday        date;
  DECLARE v_reward_active   tinyint(1);

  -- Ensure the customer is a registered account
  SELECT `IsRegistered`, `C_Birthday`
    INTO v_is_registered, v_birthday
    FROM `customer`
   WHERE `CustomerID` = NEW.CustomerID;

  IF v_is_registered = 'N' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Birthday rewards can only be claimed by registered customers.';
  END IF;

  IF v_birthday IS NULL THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Customer does not have a birthday on file; cannot claim birthday reward.';
  END IF;

  -- Verify today matches the customer birthday (day and month)
  IF MONTH(CURDATE()) <> MONTH(v_birthday) OR DAYOFMONTH(CURDATE()) <> DAYOFMONTH(v_birthday) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Birthday reward can only be claimed on the customer\'s birthday.';
  END IF;

  -- Ensure the chosen reward is currently active
  SELECT `IsActive`
    INTO v_reward_active
    FROM `birthday_reward`
   WHERE `BirthdayRewardID` = NEW.BirthdayRewardID;

  IF v_reward_active <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'The selected birthday reward is not currently active.';
  END IF;

  -- Set ClaimedYear automatically from the current date
  SET NEW.ClaimedYear = YEAR(CURDATE());
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `customer_stamp_card`
--

DROP TABLE IF EXISTS `customer_stamp_card`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_stamp_card` (
  `CardID` varchar(12) NOT NULL,
  `CustomerID` varchar(12) NOT NULL,
  `StampsCollected` int NOT NULL DEFAULT '0' COMMENT 'Current number of stamps on this card; incremented via stamp_transaction',
  `MaxStamps` int NOT NULL DEFAULT '10' COMMENT 'Maximum stamps this card can hold; when StampsCollected reaches this value the card is deactivated',
  `IsActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'FALSE when card is full (StampsCollected = MaxStamps) or manually deactivated; customer must get a new card',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`CardID`),
  KEY `CustomerID_idx` (`CustomerID`),
  CONSTRAINT `fk_stampcard_customer` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_maxstamps_positive` CHECK ((`MaxStamps` > 0)),
  CONSTRAINT `chk_stamps_bounds` CHECK (((`StampsCollected` >= 0) and (`StampsCollected` <= `MaxStamps`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_stamp_card`
--

LOCK TABLES `customer_stamp_card` WRITE;
/*!40000 ALTER TABLE `customer_stamp_card` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_stamp_card` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food`
--

DROP TABLE IF EXISTS `food`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food` (
  `ProductID` varchar(12) NOT NULL,
  `FoodType` enum('Snacks','Meals') NOT NULL,
  PRIMARY KEY (`ProductID`),
  CONSTRAINT `fk_food_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food`
--

LOCK TABLES `food` WRITE;
/*!40000 ALTER TABLE `food` DISABLE KEYS */;
/*!40000 ALTER TABLE `food` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `IngredientID` varchar(12) NOT NULL,
  `IngredientName` varchar(150) NOT NULL,
  `StockQuantity` decimal(12,2) NOT NULL DEFAULT '0.00',
  `Unit` varchar(20) NOT NULL,
  `LowStockThreshold` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`IngredientID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `NotificationID` varchar(12) NOT NULL,
  `StaffID` varchar(12) NOT NULL,
  `OrderID` varchar(12) NOT NULL,
  `Message` varchar(255) NOT NULL,
  `IsRead` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `StaffID_idx` (`StaffID`),
  KEY `OrderID_idx` (`OrderID`),
  CONSTRAINT `fk_notif_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_notif_staff` FOREIGN KEY (`StaffID`) REFERENCES `staff` (`StaffID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item`
--

DROP TABLE IF EXISTS `order_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item` (
  `OrderItemID` varchar(12) NOT NULL,
  `OrderID` varchar(12) NOT NULL,
  `VariantID` varchar(12) NOT NULL,
  `Quantity` int NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`OrderItemID`),
  KEY `OrderID_idx` (`OrderID`),
  KEY `VariantID_idx` (`VariantID`),
  CONSTRAINT `fk_item_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_item_variant` FOREIGN KEY (`VariantID`) REFERENCES `product_variant` (`VariantID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item`
--

LOCK TABLES `order_item` WRITE;
/*!40000 ALTER TABLE `order_item` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item_addon`
--

DROP TABLE IF EXISTS `order_item_addon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_item_addon` (
  `AddonID` varchar(12) NOT NULL,
  `OrderItemID` varchar(12) NOT NULL,
  `IngredientID` varchar(12) NOT NULL,
  `Quantity` decimal(12,2) NOT NULL,
  `AddonPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`AddonID`),
  UNIQUE KEY `uq_addon_item_ingredient` (`OrderItemID`,`IngredientID`),
  KEY `IngredientID_idx` (`IngredientID`),
  CONSTRAINT `fk_addon_ingredient` FOREIGN KEY (`IngredientID`) REFERENCES `ingredients` (`IngredientID`) ON UPDATE CASCADE,
  CONSTRAINT `fk_addon_orderitem` FOREIGN KEY (`OrderItemID`) REFERENCES `order_item` (`OrderItemID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item_addon`
--

LOCK TABLES `order_item_addon` WRITE;
/*!40000 ALTER TABLE `order_item_addon` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_item_addon` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `OrderID` varchar(12) NOT NULL,
  `CustomerID` varchar(12) DEFAULT NULL COMMENT 'References the unified customer table; NULL only if the order is not linked to any customer row',
  `StaffID` varchar(12) NOT NULL,
  `RewardID` varchar(12) DEFAULT NULL,
  `OrderDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `OrderStatus` enum('Processing','Being Prepared','Ready for Pickup','To Be Delivered','Completed') NOT NULL,
  `FinalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`OrderID`),
  KEY `CustomerID_idx` (`CustomerID`),
  KEY `StaffID_idx` (`StaffID`),
  KEY `RewardID_idx` (`RewardID`),
  CONSTRAINT `fk_order_customer` FOREIGN KEY (`CustomerID`) REFERENCES `customer` (`CustomerID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_order_reward` FOREIGN KEY (`RewardID`) REFERENCES `stamp_reward` (`RewardID`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_order_staff` FOREIGN KEY (`StaffID`) REFERENCES `staff` (`StaffID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `PaymentID` varchar(12) NOT NULL,
  `OrderID` varchar(12) NOT NULL,
  `PaymentMethod` enum('GCash','In-store') NOT NULL,
  `PaymentStatus` enum('Paid','Pending') NOT NULL DEFAULT 'Pending',
  `AmountPaid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `TransactionReference` varchar(100) DEFAULT NULL COMMENT 'For walk-in customers, this TransactionReference (or PaymentID) serves as the receipt ID for order verification',
  `PaidAt` datetime DEFAULT NULL,
  PRIMARY KEY (`PaymentID`),
  UNIQUE KEY `uq_payment_order` (`OrderID`),
  CONSTRAINT `fk_payment_order` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `ProductID` varchar(12) NOT NULL,
  `ProductName` varchar(150) NOT NULL,
  `Category` enum('Beverage','Food') NOT NULL,
  `IsAvailable` tinyint(1) NOT NULL DEFAULT '0',
  `ImageURL` varchar(2050) NOT NULL,
  PRIMARY KEY (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_ingredient`
--

DROP TABLE IF EXISTS `product_ingredient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_ingredient` (
  `VariantID` varchar(12) NOT NULL,
  `IngredientID` varchar(12) NOT NULL,
  `QuantityUsed` decimal(12,2) NOT NULL,
  PRIMARY KEY (`VariantID`,`IngredientID`),
  KEY `IngredientID_idx` (`IngredientID`),
  CONSTRAINT `fk_pi_ingredient` FOREIGN KEY (`IngredientID`) REFERENCES `ingredients` (`IngredientID`) ON UPDATE CASCADE,
  CONSTRAINT `fk_pi_variant` FOREIGN KEY (`VariantID`) REFERENCES `product_variant` (`VariantID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_ingredient`
--

LOCK TABLES `product_ingredient` WRITE;
/*!40000 ALTER TABLE `product_ingredient` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_ingredient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variant`
--

DROP TABLE IF EXISTS `product_variant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variant` (
  `VariantID` varchar(12) NOT NULL,
  `ProductID` varchar(12) NOT NULL,
  `SizeLabel` enum('Small','Medium','Large','XXL') DEFAULT NULL,
  `SizeOz` enum('8oz','12oz','16oz','22oz') DEFAULT NULL,
  `Price` decimal(10,2) NOT NULL,
  `IsAvailable` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`VariantID`),
  KEY `ProductID_idx` (`ProductID`),
  CONSTRAINT `fk_variant_product` FOREIGN KEY (`ProductID`) REFERENCES `product` (`ProductID`) ON UPDATE CASCADE,
  CONSTRAINT `size_exclusive` CHECK ((((`SizeLabel` is not null) and (`SizeOz` is null)) or ((`SizeLabel` is null) and (`SizeOz` is not null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variant`
--

LOCK TABLES `product_variant` WRITE;
/*!40000 ALTER TABLE `product_variant` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `StaffID` varchar(12) NOT NULL,
  `S_FirstName` varchar(50) NOT NULL,
  `S_LastName` varchar(50) NOT NULL,
  `Role` enum('Cashier','Barista','Admin') NOT NULL,
  `S_PhoneNumber` int NOT NULL,
  `S_Username` varchar(50) NOT NULL,
  `S_Password` varchar(100) NOT NULL,
  `S_Email` varchar(200) NOT NULL,
  PRIMARY KEY (`StaffID`),
  UNIQUE KEY `Username_UNIQUE` (`S_Username`),
  UNIQUE KEY `Email_UNIQUE` (`S_Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stamp_reward`
--

DROP TABLE IF EXISTS `stamp_reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stamp_reward` (
  `RewardID` varchar(12) NOT NULL,
  `RewardName` varchar(150) NOT NULL,
  `RewardType` enum('Free Item','Percentage','Fixed Amount') NOT NULL,
  `RewardValue` decimal(10,2) NOT NULL DEFAULT '0.00',
  `StampsRequired` int NOT NULL COMMENT 'Number of stamps needed on the card to unlock this reward',
  PRIMARY KEY (`RewardID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stamp_reward`
--

LOCK TABLES `stamp_reward` WRITE;
/*!40000 ALTER TABLE `stamp_reward` DISABLE KEYS */;
/*!40000 ALTER TABLE `stamp_reward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stamp_transaction`
--

DROP TABLE IF EXISTS `stamp_transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stamp_transaction` (
  `StampTxnID` varchar(12) NOT NULL,
  `CardID` varchar(12) NOT NULL,
  `OrderItemID` varchar(12) NOT NULL COMMENT 'The beverage order item that triggered this stamp; must belong to a Beverage product',
  `StampsEarned` int NOT NULL DEFAULT '1' COMMENT 'Number of stamps awarded for this transaction (typically 1 per beverage purchased)',
  `EarnedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`StampTxnID`),
  KEY `CardID_idx` (`CardID`),
  KEY `OrderItemID_idx` (`OrderItemID`),
  CONSTRAINT `fk_stamptxn_card` FOREIGN KEY (`CardID`) REFERENCES `customer_stamp_card` (`CardID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_stamptxn_orderitem` FOREIGN KEY (`OrderItemID`) REFERENCES `order_item` (`OrderItemID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_stamps_earned_positive` CHECK ((`StampsEarned` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stamp_transaction`
--

LOCK TABLES `stamp_transaction` WRITE;
/*!40000 ALTER TABLE `stamp_transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `stamp_transaction` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_stamp_beverage_only` BEFORE INSERT ON `stamp_transaction` FOR EACH ROW BEGIN
  DECLARE v_category VARCHAR(20);

  SELECT p.`Category`
    INTO v_category
    FROM `order_item`       oi
    JOIN `product_variant`  pv ON pv.`VariantID`  = oi.`VariantID`
    JOIN `product`          p  ON p.`ProductID`   = pv.`ProductID`
   WHERE oi.`OrderItemID` = NEW.OrderItemID;

  IF v_category <> 'Beverage' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Stamps can only be earned for beverage purchases.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_stamp_card_active` BEFORE INSERT ON `stamp_transaction` FOR EACH ROW BEGIN
  DECLARE v_is_active      tinyint(1);
  DECLARE v_stamps         int;
  DECLARE v_max_stamps     int;

  SELECT `IsActive`, `StampsCollected`, `MaxStamps`
    INTO v_is_active, v_stamps, v_max_stamps
    FROM `customer_stamp_card`
   WHERE `CardID` = NEW.CardID;

  IF v_is_active = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'This stamp card is no longer active. The customer must use a new card.';
  END IF;

  IF (v_stamps + NEW.StampsEarned) > v_max_stamps THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Adding these stamps would exceed the card maximum. Earn remaining stamps only or start a new card.';
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_stamp_update_card` AFTER INSERT ON `stamp_transaction` FOR EACH ROW BEGIN
  UPDATE `customer_stamp_card`
     SET `StampsCollected` = `StampsCollected` + NEW.StampsEarned,
         `IsActive`        = IF((`StampsCollected` + NEW.StampsEarned) >= `MaxStamps`, 0, 1)
   WHERE `CardID` = NEW.CardID;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Dumping events for database 'salespresso_db'
--

--
-- Dumping routines for database 'salespresso_db'
--
/*!50003 DROP PROCEDURE IF EXISTS `sp_add_product` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_product`(
    IN p_ProductID        VARCHAR(12),
    IN p_ProductName      VARCHAR(150),
    IN p_Category         ENUM('Beverage','Food'),
    IN p_IsAvailable      TINYINT(1),
    IN p_ImageURL         VARCHAR(2050),
    -- Food-specific (pass NULL when adding a Beverage)
    IN p_FoodType         ENUM('Snacks','Meals'),
    -- Beverage-specific (pass NULL when adding Food)
    IN p_BeverageType     ENUM('Hot','Iced'),
    IN p_BeverageSubtype  ENUM('Coffee','Mocktails','Fruit Soda','Milk-based','Matcha','Lemonade')
)
BEGIN
    -- ── Validation ───────────────────────────────────────────
    IF p_Category = 'Food' AND p_FoodType IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'FoodType is required when Category is Food.';
    END IF;

    IF p_Category = 'Beverage' AND p_BeverageType IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'BeverageType is required when Category is Beverage.';
    END IF;

    IF p_Category = 'Beverage' AND p_BeverageSubtype IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'BeverageSubtype is required when Category is Beverage.';
    END IF;

    -- ── Insert into product ──────────────────────────────────
    INSERT INTO `product` (`ProductID`, `ProductName`, `Category`, `IsAvailable`, `ImageURL`)
    VALUES (p_ProductID, p_ProductName, p_Category, p_IsAvailable, p_ImageURL);

    -- ── Insert into the matching category table ──────────────
    IF p_Category = 'Food' THEN

        INSERT INTO `food` (`ProductID`, `FoodType`)
        VALUES (p_ProductID, p_FoodType);

    ELSEIF p_Category = 'Beverage' THEN

        INSERT INTO `beverage` (`ProductID`, `BeverageType`, `BeverageSubtype`)
        VALUES (p_ProductID, p_BeverageType, p_BeverageSubtype);

    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_recalc_final_amount` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_recalc_final_amount`(IN p_order_id VARCHAR(12))
BEGIN
  DECLARE v_subtotal   DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_disc_type  VARCHAR(20)   DEFAULT NULL;
  DECLARE v_disc_value DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_final      DECIMAL(10,2) DEFAULT 0.00;

  -- Sum order_item subtotals plus all addon charges for this order
  SELECT COALESCE(
           SUM(oi.`Subtotal`) + COALESCE(SUM(a.`AddonPrice` * a.`Quantity`), 0),
           0
         )
    INTO v_subtotal
    FROM `order_item` oi
    LEFT JOIN `order_item_addon` a ON a.`OrderItemID` = oi.`OrderItemID`
   WHERE oi.`OrderID` = p_order_id;

  -- Fetch reward discount if one is linked to the order
  SELECT sr.`RewardType`, sr.`RewardValue`
    INTO v_disc_type, v_disc_value
    FROM `orders` o
    JOIN `stamp_reward` sr ON sr.`RewardID` = o.`RewardID`
   WHERE o.`OrderID` = p_order_id;

  -- Apply reward discount
  IF v_disc_type = 'Fixed Amount' THEN
    SET v_final = v_subtotal - v_disc_value;
  ELSEIF v_disc_type = 'Percentage' THEN
    SET v_final = v_subtotal - (v_subtotal * v_disc_value / 100);
  ELSE
    SET v_final = v_subtotal;
  END IF;

  -- Ensure FinalAmount never goes negative
  IF v_final < 0 THEN
    SET v_final = 0.00;
  END IF;

  UPDATE `orders`
     SET `FinalAmount` = v_final
   WHERE `OrderID` = p_order_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `sp_update_product` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb3 */ ;
/*!50003 SET character_set_results = utf8mb3 */ ;
/*!50003 SET collation_connection  = utf8mb3_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_update_product`(
    IN p_ProductID        VARCHAR(12),
    IN p_ProductName      VARCHAR(150),
    IN p_Category         ENUM('Beverage','Food'),
    IN p_IsAvailable      TINYINT(1),
    IN p_ImageURL         VARCHAR(2050),
    -- Food-specific (pass NULL when updating to Beverage)
    IN p_FoodType         ENUM('Snacks','Meals'),
    -- Beverage-specific (pass NULL when updating to Food)
    IN p_BeverageType     ENUM('Hot','Iced'),
    IN p_BeverageSubtype  ENUM('Coffee','Mocktails','Fruit Soda','Milk-based','Matcha','Lemonade')
)
BEGIN
    DECLARE v_old_category ENUM('Beverage','Food');

    -- ── Validation ───────────────────────────────────────────
    IF p_Category = 'Food' AND p_FoodType IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'FoodType is required when Category is Food.';
    END IF;

    IF p_Category = 'Beverage' AND p_BeverageType IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'BeverageType is required when Category is Beverage.';
    END IF;

    IF p_Category = 'Beverage' AND p_BeverageSubtype IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'BeverageSubtype is required when Category is Beverage.';
    END IF;

    -- ── Fetch the current category ───────────────────────────
    SELECT `Category`
      INTO v_old_category
      FROM `product`
     WHERE `ProductID` = p_ProductID;

    IF v_old_category IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Product not found.';
    END IF;

    -- ── Update core product fields ───────────────────────────
    UPDATE `product`
       SET `ProductName`  = p_ProductName,
           `Category`     = p_Category,
           `IsAvailable`  = p_IsAvailable,
           `ImageURL`     = p_ImageURL
     WHERE `ProductID` = p_ProductID;

    -- ── Handle category switch: remove old category row ──────
    --    (FK ON DELETE CASCADE covers variants/ingredients,
    --     but food/beverage rows need explicit cleanup on
    --     a *category change* since the ProductID stays the same.)
    IF v_old_category <> p_Category THEN
        IF v_old_category = 'Food' THEN
            DELETE FROM `food`     WHERE `ProductID` = p_ProductID;
        ELSEIF v_old_category = 'Beverage' THEN
            DELETE FROM `beverage` WHERE `ProductID` = p_ProductID;
        END IF;
    END IF;

    -- ── Upsert into the correct category table ───────────────
    IF p_Category = 'Food' THEN

        INSERT INTO `food` (`ProductID`, `FoodType`)
        VALUES (p_ProductID, p_FoodType)
        ON DUPLICATE KEY UPDATE
            `FoodType` = p_FoodType;

    ELSEIF p_Category = 'Beverage' THEN

        INSERT INTO `beverage` (`ProductID`, `BeverageType`, `BeverageSubtype`)
        VALUES (p_ProductID, p_BeverageType, p_BeverageSubtype)
        ON DUPLICATE KEY UPDATE
            `BeverageType`    = p_BeverageType,
            `BeverageSubtype` = p_BeverageSubtype;

    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-23 17:41:43
