-- Add hash index for originalUrl to enable fast duplicate URL detection
CREATE INDEX IF NOT EXISTS "link_original_url_hash_idx" ON "Link" USING hash ("original_url");
