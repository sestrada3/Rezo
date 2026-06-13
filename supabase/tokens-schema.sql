-- User tokens table: stores Gmail refresh tokens, watch state, push subscriptions
CREATE TABLE IF NOT EXISTS user_tokens (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email         text NOT NULL,
  refresh_token text,
  history_id    text,
  watch_expiry  timestamptz,
  push_sub      jsonb,
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own row
CREATE POLICY "Users manage own tokens"
  ON user_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role (used by webhook) bypasses RLS automatically
