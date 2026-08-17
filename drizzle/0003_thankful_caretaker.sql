CREATE TABLE `workspaceContentHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceCardId` int NOT NULL,
	`action` varchar(40) NOT NULL,
	`fromStatus` varchar(24),
	`toStatus` varchar(24),
	`actorUserId` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspaceContentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `workspaceCards` DROP INDEX `workspaceCards_slot_unique`;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `status` enum('draft','in_review','approved','scheduled','published','unpublished','archived') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `scheduledFor` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `publishedAt` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `expiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `reviewBy` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `ownerUserId` int;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `createdByUserId` int;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `archivedByUserId` int;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `archivedAt` timestamp;--> statement-breakpoint
ALTER TABLE `workspaceCards` ADD `reviewReminderSentAt` timestamp;