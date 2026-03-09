CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer NOT NULL,
	`author_name` text NOT NULL,
	`author_email` text,
	`content` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `comments_post_id_idx` ON `comments` (`post_id`);--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`subject` text,
	`message` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE TABLE `newsletter_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`newsletter_id` integer NOT NULL,
	`subscriber_email` text NOT NULL,
	`status` text DEFAULT 'sent' NOT NULL,
	`error` text,
	`sent_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`newsletter_id`) REFERENCES `newsletters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `newsletters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subject` text NOT NULL,
	`content` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`sent_at` integer,
	`post_id` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`webhook_id` integer NOT NULL,
	`status` integer,
	`success` integer NOT NULL,
	`payload` text NOT NULL,
	`response` text,
	`error` text,
	`duration` integer,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `webhook_deliveries_webhook_id_idx` ON `webhook_deliveries` (`webhook_id`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`event` text DEFAULT 'post.published' NOT NULL,
	`secret` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
ALTER TABLE `posts` ADD `view_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` ADD `meta_title` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `meta_description` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `og_image` text;--> statement-breakpoint
ALTER TABLE `posts` ADD `is_premium` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_subscription_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_price_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `stripe_current_period_end` integer;