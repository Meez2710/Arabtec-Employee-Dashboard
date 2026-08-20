CREATE TABLE `workspaceAcknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceCardId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceAcknowledgements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entity` varchar(40) NOT NULL,
	`entityId` int,
	`action` varchar(40) NOT NULL,
	`actorUserId` int,
	`actorLabel` varchar(200),
	`summary` varchar(400),
	`beforeJson` text,
	`afterJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaceSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` enum('new_joiner','company_news','announcement','activity','industry_watch','opportunity','week_ahead','resource') NOT NULL,
	`labelEn` varchar(80) NOT NULL,
	`labelAr` varchar(80) NOT NULL,
	`enabled` int NOT NULL DEFAULT 1,
	`defaultSize` enum('1x1','2x1','1x2') NOT NULL DEFAULT '1x1',
	`sortOrder` int NOT NULL DEFAULT 0,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceSections_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceSections_slot_unique` UNIQUE(`slot`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','editor','admin','viewer','publisher') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `workspaceCards` MODIFY COLUMN `slot` enum('new_joiner','company_news','announcement','activity','industry_watch','opportunity','week_ahead','resource') NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceHoverCards` MODIFY COLUMN `parentSlot` enum('new_joiner','company_news','announcement','activity','industry_watch','opportunity','week_ahead','resource') NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `imageAlt` varchar(220);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `eyebrowAr` varchar(80);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `titleAr` varchar(180);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `bodyAr` text;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `imageAltAr` varchar(220);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `cardSize` enum('1x1','2x1','1x2') DEFAULT '1x1' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `severity` enum('normal','important','critical') DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `requiresAck` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `eventStart` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `eventEnd` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `location` varchar(160);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `functionArea` varchar(120);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `closingDate` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `sourceName` varchar(160);--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `resourceType` enum('policy','form','handbook','template','contact');