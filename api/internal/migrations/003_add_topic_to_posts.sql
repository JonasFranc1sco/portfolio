ALTER TABLE posts ADD COLUMN topic VARCHAR(100) NOT NULL DEFAULT 'geral';
CREATE INDEX IF NOT EXISTS idx_posts_topic ON posts(topic);
