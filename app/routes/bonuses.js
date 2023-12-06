import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    const GET_SCHEMA =
    {
        params:
        {
            type: "object",
            required: [ "session_id" ],
            additionalProperties: false,
            properties:
            {
                "session_id": { $ref: "positive_int" }
            }
        }
    };
    app.get("/session/:session_id", { schema: GET_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        const bonuses_query_string = `SELECT id, index, nickname, slot_name, bet_size, currency, winning FROM bonuses_view WHERE session_id = %L`;
        const session_query_string = `SELECT id, balance, currency, mode, is_on FROM sessions_view WHERE id = %L`;
        const batch = new Database.AnonymousBatch();
        batch.execute(Database.format(bonuses_query_string, req.params.session_id));
        batch.execute({ query: Database.format(session_query_string, req.params.session_id), one_response: true });
        const [ bonuses, session ] = await batch.commit();
        return res.render("general/layout.ejs", { template: "bonuses", session, bonuses });
    });
    
    const SESSION_POST_SCHEMA =
    {
        params:
        {
            type: "object",
            required: [ "session_id" ],
            additionalProperties: false,
            properties:
            {
                "session_id": { $ref: "positive_int" }
            }
        },
        body:
        {
            type: "object",
            required: [ "authentication" ],
            additionalProperties: false,
            minProperties: 2,
            properties:
            {
                "on": { type: "boolean" },
                "off": { type: "boolean" },
                "main": { type: "boolean" },
                "start": { type: "boolean" },
                "balance": { $ref: "uint" },
                "currency": { $ref: "currency" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/session/:session_id", { schema: SESSION_POST_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        const updates = { };
        if (req.body.on) updates.is_on = true;
        if (req.body.off) updates.is_on = false;
        if (req.body.main) updates.mode = "MAIN";
        if (req.body.start) updates.mode = "START";
        if (req.body.balance) updates.balance = req.body.balance;
        if (req.body.currency) updates.currency = req.body.currency;
        const keys = "%I,".repeat(Object.keys(updates).length).slice(0, -1);
        const values = Object.keys(updates).map((_, index) => `$${index + 2}`).join(',');
        const query_string = Database.format(`UPDATE sessions SET (${keys}) = ROW(${values}) WHERE id = $1`, ...Object.keys(updates));
        await Database.execute(query_string, [ req.params.session_id, ...Object.values(updates) ]);
        return res.status(303).redirect(`/session/${req.params.session_id}`);
    });
    
    const BONUS_POST_SCHEMA =
    {
        params:
        {
            type: "object",
            required: [ "session_id" ],
            additionalProperties: false,
            properties:
            {
                "session_id": { $ref: "positive_int" }
            }
        },
        body:
        {
            type: "object",
            required: [ "nickname", "slot_name", "bet_size", "currency", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "id": { $ref: "positive_int" },
                "nickname": { type: "string" },
                "slot_name": { type: "string" },
                "bet_size": { $ref: "uint" },
                // "currency": { $ref: "currency" },
                "winning": { $ref: "uint" },
                "update": { type: "boolean" },
                "delete": { type: "boolean" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/session/:session_id/bonus", { schema: BONUS_POST_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        const { nickname, slot_name, bet_size, currency = "ROUBLE", winning } = req.body;
        if (req.body.delete)
        {
            const query_string = `DELETE FROM bonuses WHERE id = $1 AND session_id = $2`;
            await Database.execute(query_string, [ req.body.id, req.params.session_id ]);
        }
        else if (req.body.update)
        {
            const query_string = `UPDATE bonuses SET (nickname, slot_name, bet_size, currency, winning) = ($1, $2, $3, $4, $5) WHERE id = $6 AND session_id = $7`;
            await Database.execute(query_string, [ nickname, slot_name, bet_size, currency, winning, req.body.id, req.params.session_id ]);
        }
        else
        {
            const query_string = `INSERT INTO bonuses (session_id, nickname, slot_name, bet_size, currency) VALUES ($1, $2, $3, $4, $5)`;
            await Database.execute(query_string, [ req.params.session_id, nickname, slot_name, bet_size, currency ]);
        }
        return res.status(303).redirect(`/session/${req.params.session_id}`);
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });