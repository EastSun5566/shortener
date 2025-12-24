CREATE INDEX "link_shorten_key_idx" ON "Link" USING btree ("shorten_key");--> statement-breakpoint
CREATE INDEX "link_user_id_idx" ON "Link" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "User" USING btree ("email");