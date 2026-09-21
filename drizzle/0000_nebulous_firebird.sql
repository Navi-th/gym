CREATE TABLE `automation_rules` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`trigger` text NOT NULL,
	`offset_days` integer NOT NULL,
	`template_key` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`template_key`) REFERENCES `message_templates`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `counters` (
	`name` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_code` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`gender` text,
	`dob` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`plan_id` text,
	`plan_start` text,
	`plan_end` text,
	`frozen_until` text,
	`stage` text DEFAULT 'lead' NOT NULL,
	`notes` text,
	`whatsapp_opt_in` integer DEFAULT false NOT NULL,
	`opt_in_at` text,
	`joined_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_members_phone` ON `members` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_members_plan_end` ON `members` (`plan_end`);--> statement-breakpoint
CREATE INDEX `idx_members_stage` ON `members` (`stage`);--> statement-breakpoint
CREATE TABLE `message_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`category` text DEFAULT 'utility' NOT NULL,
	`body` text NOT NULL,
	`variables` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `message_templates_key_unique` ON `message_templates` (`key`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`subscription_id` text,
	`rule_id` text,
	`template_key` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`to_phone` text NOT NULL,
	`channel` text DEFAULT 'whatsapp' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`provider_message_id` text,
	`rendered_body` text,
	`error` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`sent_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`rule_id`) REFERENCES `automation_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `messages_dedupe_key_unique` ON `messages` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_messages_member` ON `messages` (`member_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`subscription_id` text,
	`amount_cents` integer NOT NULL,
	`method` text NOT NULL,
	`paid_at` text NOT NULL,
	`period_start` text,
	`period_end` text,
	`reference` text,
	`note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_payments_member` ON `payments` (`member_id`);--> statement-breakpoint
CREATE TABLE `plans` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`price_cents` integer NOT NULL,
	`billing_period` text NOT NULL,
	`duration_days` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`price_cents_charged` integer NOT NULL,
	`freeze_days` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_subs_member` ON `subscriptions` (`member_id`);--> statement-breakpoint
CREATE INDEX `idx_subs_end` ON `subscriptions` (`end_date`);