CREATE VIEW bonuses_view AS
    SELECT
        bonuses.*, sessions.is_on,
        ROW_NUMBER() OVER (PARTITION BY bonuses.session_id ORDER BY bonuses.id) AS index,
        (ROW_NUMBER() OVER (PARTITION BY (bonuses.session_id, bonuses.winning) ORDER BY bonuses.id) = 1) AND bonuses.winning IS NULL AS is_active
    FROM bonuses INNER JOIN sessions ON sessions.id = bonuses.session_id
    ORDER BY id;

CREATE VIEW sessions_view AS
    SELECT
        COUNT(bonuses.*) AS bonuses,
        sessions.id, sessions.balance, sessions.currency, sessions.is_on, sessions.created,
        (CASE WHEN (COUNT(bonuses.*) FILTER (WHERE bonuses.winning IS NULL) > 0) THEN sessions.mode ELSE 'MAIN' END) AS mode
    FROM sessions LEFT JOIN bonuses ON sessions.id = bonuses.session_id
    GROUP BY sessions.id;