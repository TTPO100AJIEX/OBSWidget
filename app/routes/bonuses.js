import DataWidgetEvent from './widget_events/DataWidgetEvent.js';
import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';
import InsertBonusWidgetEvent from './widget_events/InsertBonusWidgetEvent.js';
import UpdateBonusWidgetEvent from './widget_events/UpdateBonusWidgetEvent.js';
import DeleteBonusWidgetEvent from './widget_events/DeleteBonusWidgetEvent.js';
import ActiveBonusWidgetEvent from './widget_events/ActiveBonusWidgetEvent.js';
import SessionUpdateWidgetEvent from './widget_events/SessionUpdateWidgetEvent.js';

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
        const bonuses_query_string = `SELECT * FROM bonuses_view WHERE session_id = %L`;
        const session_query_string = `SELECT * FROM sessions_view WHERE id = %L`;
        const batch = new Database.AnonymousBatch();
        batch.execute(Database.format(bonuses_query_string, req.params.session_id));
        batch.execute({ query: Database.format(session_query_string, req.params.session_id), one_response: true });
        const [ bonuses, session ] = await batch.commit();
        if (!session) throw 404;
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

        if (req.body.on || req.body.off) await new DataWidgetEvent().dispatch();
        else await new SessionUpdateWidgetEvent(req.params.session_id).dispatch();

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
            required: [ "slot_name", "bet_size", "currency", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "id": { $ref: "positive_int" },
                "slot_name": { type: "string" },
                "bet_size": { $ref: "uint" },
                "currency": { $ref: "currency" },
                "winning": { $ref: "optional_uint" },
                "update": { type: "boolean" },
                "delete": { type: "boolean" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/session/:session_id/bonus", { schema: BONUS_POST_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        const { slot_name, bet_size, currency = "ROUBLE", winning } = req.body;
        if (req.body.delete)
        {
            const query_string = `DELETE FROM bonuses WHERE id = $1 AND session_id = $2`;
            await Database.execute(query_string, [ req.body.id, req.params.session_id ]);
            await new DeleteBonusWidgetEvent(req.params.session_id, req.body.id).dispatch();
        }
        else if (req.body.update)
        {
            const query_string = `UPDATE bonuses SET (slot_name, bet_size, currency, winning) = ($1, $2, $3, $4) WHERE id = $5 AND session_id = $6`;
            await Database.execute(query_string, [ slot_name, bet_size, currency, winning, req.body.id, req.params.session_id ]);
            await new UpdateBonusWidgetEvent(req.params.session_id, req.body.id).dispatch();
            if (winning)
            {
                await new ActiveBonusWidgetEvent(req.params.session_id).dispatch(); // is_active may change
                await new SessionUpdateWidgetEvent(req.params.session_id).dispatch(); // The mode may switch
            }
        }
        else
        {
            const query_string = `INSERT INTO bonuses (session_id, slot_name, bet_size, currency) VALUES ($1, $2, $3, $4)`;
            await Database.execute(query_string, [ req.params.session_id, slot_name, bet_size, currency ]);
            await new InsertBonusWidgetEvent(req.params.session_id).dispatch();
            await new SessionUpdateWidgetEvent(req.params.session_id).dispatch(); // The mode may switch
        }
        return res.status(303).redirect(`/session/${req.params.session_id}`);
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });