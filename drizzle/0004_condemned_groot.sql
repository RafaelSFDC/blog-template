CREATE TABLE `page_views` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`visitor_id` text,
	`url` text NOT NULL,
	`pathname` text NOT NULL,
	`referrer` text,
	`user_agent` text,
	`browser` text,
	`os` text,
	`device` text,
	`timestamp` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`visitor_id`) REFERENCES `visitors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `page_views_visitor_id_idx` ON `page_views` (`visitor_id`);--> statement-breakpoint
CREATE INDEX `page_views_pathname_idx` ON `page_views` (`pathname`);--> statement-breakpoint
CREATE INDEX `page_views_timestamp_idx` ON `page_views` (`timestamp`);--> statement-breakpoint
CREATE TABLE `visitors` (
	`id` text PRIMARY KEY NOT NULL,
	`last_seen_at` integer DEFAULT (unixepoch()),
	`created_at` integer DEFAULT (unixepoch())
);
