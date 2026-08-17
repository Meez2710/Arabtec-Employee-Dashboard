CREATE TABLE `dailyDigestEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digestId` int NOT NULL,
	`category` varchar(80) NOT NULL,
	`headline` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`audience` enum('employees','owners','joiners') NOT NULL DEFAULT 'employees',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyDigestEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyDigests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`digestDate` varchar(10) NOT NULL,
	`title` varchar(140) NOT NULL,
	`introduction` text NOT NULL,
	`status` enum('draft','in_review','approved','published') NOT NULL DEFAULT 'draft',
	`scheduledFor` timestamp,
	`recipientCount` int NOT NULL DEFAULT 0,
	`updatedByUserId` int,
	`publishedByUserId` int,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyDigests_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailyDigests_digestDate_unique` UNIQUE(`digestDate`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','editor','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
