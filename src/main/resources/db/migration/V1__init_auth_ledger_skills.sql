CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
                       id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                       email           VARCHAR(255) NOT NULL UNIQUE,
                       password_hash   VARCHAR(255) NOT NULL,
                       display_name    VARCHAR(100) NOT NULL,
                       bio             TEXT,
                       bio_embedding   vector(1536),
                       created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE skills (
                        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        name            VARCHAR(100) NOT NULL UNIQUE,
                        category        VARCHAR(100),
                        embedding       vector(1536),
                        created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE skill_role AS ENUM ('OFFERED', 'WANTED');
CREATE TYPE proficiency_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

CREATE TABLE user_skills (
                             id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                             user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                             skill_id        UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                             role            skill_role NOT NULL,
                             proficiency     proficiency_level,
                             created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                             UNIQUE (user_id, skill_id, role)
);

CREATE TYPE ledger_entry_type AS ENUM ('SESSION_PAYMENT', 'SIGNUP_BONUS', 'ADJUSTMENT');

CREATE TABLE ledger_entries (
                                id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                                txn_group_id    UUID NOT NULL,
                                user_id         UUID NOT NULL REFERENCES users(id),
                                amount          NUMERIC(10,2) NOT NULL,
                                entry_type      ledger_entry_type NOT NULL,
                                reference_id    UUID,
                                created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
                                CONSTRAINT amount_nonzero CHECK (amount <> 0)
);

CREATE INDEX idx_ledger_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_txn_group ON ledger_entries(txn_group_id);

CREATE VIEW user_balances AS
SELECT user_id, SUM(amount) AS balance
FROM ledger_entries
GROUP BY user_id;