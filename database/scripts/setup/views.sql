CREATE VIEW bonuses_view AS
    SELECT
        *,
        ROW_NUMBER() OVER (PARTITION BY session_id ORDER BY id) AS index,
	    (ROW_NUMBER() OVER (PARTITION BY (session_id, winning) ORDER BY id) = 1) AND winning IS NULL AS is_active
    FROM bonuses ORDER BY id;

CREATE VIEW sessions_view AS
    SELECT
        COUNT(bonuses.*) AS bonuses,
        sessions.id, sessions.balance, sessions.currency, sessions.is_on, sessions.created,
        (CASE WHEN (COUNT(bonuses.*) FILTER (WHERE bonuses.winning IS NULL) > 0) THEN sessions.mode ELSE 'MAIN' END) AS mode
    FROM sessions LEFT JOIN bonuses ON sessions.id = bonuses.session_id
    GROUP BY sessions.id;