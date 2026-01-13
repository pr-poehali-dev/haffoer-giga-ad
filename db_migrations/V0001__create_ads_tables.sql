-- Создание таблицы для рекламных объявлений
CREATE TABLE IF NOT EXISTS ads (
    id SERIAL PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('photo', 'video')),
    url TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0
);

-- Создание таблицы для отслеживания лайков пользователей
CREATE TABLE IF NOT EXISTS ad_likes (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id),
    user_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ad_id, user_id)
);

-- Создание таблицы для отслеживания просмотров
CREATE TABLE IF NOT EXISTS ad_views (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER NOT NULL REFERENCES ads(id),
    user_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(ad_id, user_id)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_likes_ad_id ON ad_likes(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id ON ad_views(ad_id);