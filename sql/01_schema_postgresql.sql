-- PostgreSQL: создание схемы (УП.11). Логически совпадает с моделями SQLAlchemy приложения.

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    age INTEGER NOT NULL,
    city_id INTEGER REFERENCES cities (id)
);

CREATE TABLE institutions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(300) NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities (id),
    description TEXT
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    institution_id INTEGER NOT NULL REFERENCES institutions (id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE TABLE favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    institution_id INTEGER NOT NULL REFERENCES institutions (id) ON DELETE CASCADE,
    CONSTRAINT uq_fav_user_inst UNIQUE (user_id, institution_id)
);

CREATE TABLE admission_preferences (
    user_id INTEGER PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    preferred_city_id INTEGER REFERENCES cities (id),
    study_direction VARCHAR(200)
);

CREATE INDEX ix_users_email ON users (email);
CREATE INDEX ix_favorites_user_id ON favorites (user_id);
CREATE INDEX ix_favorites_institution_id ON favorites (institution_id);
CREATE INDEX ix_reviews_institution_id ON reviews (institution_id);
