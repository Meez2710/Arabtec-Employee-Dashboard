CREATE TABLE `workspaceCards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slot` enum('new_joiner','company_news','announcement','activity','industry_watch','opportunity') NOT NULL,
	`eyebrow` varchar(80) NOT NULL,
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`linkUrl` varchar(2048),
	`imageUrl` varchar(2048),
	`imageMode` enum('none','upload','link_preview') NOT NULL DEFAULT 'none',
	`sortOrder` int NOT NULL DEFAULT 0,
	`active` int NOT NULL DEFAULT 1,
	`updatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaceCards_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaceCards_slot_unique` UNIQUE(`slot`)
);
