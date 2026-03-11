CREATE TABLE `pages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`meta_title` text,
	`meta_description` text,
	`og_image` text,
	`is_home` integer DEFAULT false NOT NULL,
	`published_at` integer,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pages_slug_unique` ON `pages` (`slug`);--> statement-breakpoint
CREATE INDEX `pages_slug_idx` ON `pages` (`slug`);--> statement-breakpoint
CREATE INDEX `pages_status_idx` ON `pages` (`status`);--> statement-breakpoint
CREATE INDEX `pages_is_home_idx` ON `pages` (`is_home`);--> statement-breakpoint
CREATE UNIQUE INDEX `pages_single_home_idx` ON `pages` (`is_home`) WHERE `is_home` = 1;--> statement-breakpoint
CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `menus_key_unique` ON `menus` (`key`);--> statement-breakpoint
CREATE TABLE `menu_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`menu_id` integer NOT NULL,
	`label` text NOT NULL,
	`href` text NOT NULL,
	`kind` text DEFAULT 'internal' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`menu_id`) REFERENCES `menus`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `menu_items_menu_id_idx` ON `menu_items` (`menu_id`);--> statement-breakpoint
CREATE INDEX `menu_items_sort_order_idx` ON `menu_items` (`menu_id`,`sort_order`);
