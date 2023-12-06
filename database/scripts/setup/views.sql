CREATE VIEW bonuses_view AS
    SELECT *, ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id) AS index
    FROM bonuses ORDER BY id;

CREATE VIEW sessions_view AS
    SELECT sessions.*, COUNT(bonuses.*) AS bonuses
    FROM sessions LEFT JOIN bonuses ON sessions.id = bonuses.session_id
    GROUP BY sessions.id;