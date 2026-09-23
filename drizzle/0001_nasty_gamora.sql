DROP TABLE `subscriptions`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
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
	FOREIGN KEY (`rule_id`) REFERENCES `automation_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_messages`("id", "member_id", "rule_id", "template_key", "dedupe_key", "to_phone", "channel", "status", "provider_message_id", "rendered_body", "error", "attempts", "sent_at", "created_at") SELECT "id", "member_id", "rule_id", "template_key", "dedupe_key", "to_phone", "channel", "status", "provider_message_id", "rendered_body", "error", "attempts", "sent_at", "created_at" FROM `messages`;--> statement-breakpoint
DROP TABLE `messages`;--> statement-breakpoint
ALTER TABLE `__new_messages` RENAME TO `messages`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `messages_dedupe_key_unique` ON `messages` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `idx_messages_member` ON `messages` (`member_id`);--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`method` text NOT NULL,
	`paid_at` text NOT NULL,
	`period_start` text,
	`period_end` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "member_id", "amount_cents", "method", "paid_at", "period_start", "period_end", "created_at") SELECT "id", "member_id", "amount_cents", "method", "paid_at", "period_start", "period_end", "created_at" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE INDEX `idx_payments_member` ON `payments` (`member_id`);--> statement-breakpoint
CREATE TABLE `__new_members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_code` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`gender` text,
	`plan_id` text,
	`plan_start` text,
	`plan_end` text,
	`frozen_until` text,
	`stage` text DEFAULT 'active' NOT NULL,
	`whatsapp_opt_in` integer DEFAULT false NOT NULL,
	`opt_in_at` text,
	`joined_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_members`("id", "member_code", "full_name", "phone", "email", "gender", "plan_id", "plan_start", "plan_end", "frozen_until", "stage", "whatsapp_opt_in", "opt_in_at", "joined_at", "created_at", "updated_at", "deleted_at") SELECT "id", "member_code", "full_name", "phone", "email", "gender", "plan_id", "plan_start", "plan_end", "frozen_until", "stage", "whatsapp_opt_in", "opt_in_at", "joined_at", "created_at", "updated_at", "deleted_at" FROM `members`;--> statement-breakpoint
DROP TABLE `members`;--> statement-breakpoint
ALTER TABLE `__new_members` RENAME TO `members`;--> statement-breakpoint
CREATE INDEX `idx_members_phone` ON `members` (`phone`);--> statement-breakpoint
CREATE INDEX `idx_members_plan_end` ON `members` (`plan_end`);--> statement-breakpoint
CREATE INDEX `idx_members_stage` ON `members` (`stage`);