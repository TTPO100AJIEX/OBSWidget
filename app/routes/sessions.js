import { Database } from 'common/databases/PostgreSQL/PostgreSQL.js';

async function register(app, options)
{
    app.get("/sessions", { config: { access: "authorization" } }, async (req, res) =>
    {
        const sessions = await Database.execute(`SELECT id, balance, currency, bonuses, created FROM sessions_view`);
        return res.render("general/layout.ejs", { template: "sessions", sessions });
    });

    
    const POST_SCHEMA =
    {
        body:
        {
            type: "object",
            required: [ ],
            additionalProperties: false,
            properties:
            {
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/sessions", { schema: POST_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        await Database.execute("INSERT INTO sessions DEFAULT VALUES");
        return res.status(303).redirect("/sessions");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });