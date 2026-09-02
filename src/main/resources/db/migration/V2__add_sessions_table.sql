CREATE TYPE session_status AS ENUM (
    'REQUESTED',
    'ACCEPTED',
    'COMPLETED',
    'DISPUTED',
    'REJECTED',
    'CANCELLED'
    );

CREATE TABLE sessions
(
    id            UUID PRIMARY KEY        DEFAULT uuid_generate_v4(),

    requester_id  UUID           NOT NULL
        REFERENCES users (id),

    provider_id   UUID           NOT NULL
        REFERENCES users (id),

    skill_id      UUID           NOT NULL
        REFERENCES skills (id),

    credit_amount NUMERIC(10, 2) NOT NULL
        CHECK (credit_amount > 0),

    status        session_status NOT NULL
                                          DEFAULT 'REQUESTED',

    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),

    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT no_self_session
        CHECK (requester_id <> provider_id)
);

CREATE INDEX idx_sessions_requester
    ON sessions (requester_id);

CREATE INDEX idx_sessions_provider
    ON sessions (provider_id);


-- Validates OLD.status -> NEW.status
CREATE OR REPLACE FUNCTION validate_session_transition()
    RETURNS TRIGGER AS
$$
BEGIN

    -- Allow updates where the status does not change
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;


    -- REQUESTED -> ACCEPTED, REJECTED, CANCELLED
    IF OLD.status = 'REQUESTED'
        AND NEW.status IN ('ACCEPTED', 'REJECTED', 'CANCELLED') THEN

        RETURN NEW;


        -- ACCEPTED -> COMPLETED, DISPUTED, CANCELLED
    ELSIF OLD.status = 'ACCEPTED'
        AND NEW.status IN ('COMPLETED', 'DISPUTED', 'CANCELLED') THEN

        RETURN NEW;


        -- COMPLETED -> DISPUTED
    ELSIF OLD.status = 'COMPLETED'
        AND NEW.status = 'DISPUTED' THEN

        RETURN NEW;

    END IF;


    RAISE EXCEPTION
        'Invalid session state transition: % -> %',
        OLD.status,
        NEW.status;

END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_validate_session_transition
    BEFORE UPDATE
    ON sessions
    FOR EACH ROW
EXECUTE FUNCTION validate_session_transition();