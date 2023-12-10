CREATE TABLE bonuses
(
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    session_id INT NOT NULL REFERENCES sessions(id) MATCH SIMPLE ON DELETE CASCADE ON UPDATE CASCADE,

    nickname TEXT NOT NULL,
    slot_name TEXT NOT NULL,
    currency CURRENCY NOT NULL,
    bet_size INT NOT NULL CHECK (bet_size >= 0),
    winning INT CHECK (winning >= 0)
);

CREATE INDEX bonuses_session_id_index ON bonuses(session_id);