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
        const bonuses_query_string = `SELECT id, index, nickname, slot_name, bet_size, winning FROM bonuses_view WHERE session_id = %L`;
        const session_query_string = `SELECT id, balance, currency FROM sessions_view WHERE id = %L`;
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
            required: [ ],
            additionalProperties: false,
            properties:
            {
                "balance": { $ref: "uint" },
                "currency": { $ref: "currency" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/session/:session_id", { schema: SESSION_POST_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        const query_string = `UPDATE sessions SET balance = $1, currency = $2 WHERE id = $3`;
        await Database.execute(query_string, [ req.body.balance, req.body.currency, req.params.session_id ]);
        return res.status(303).redirect(`/session/${req.params.session_id}`);
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });