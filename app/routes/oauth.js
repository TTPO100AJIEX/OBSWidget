import config from "common/configs/config.json" assert { type: "json" };

async function register(app, options)
{
    const VALIDATE_SCHEMA =
    {
        query:
        {
            type: "object",
            required: [ "login", "password" ],
            additionalProperties: false,
            properties:
            {
                "login": { type: "string" },
                "password": { type: "string" }
            }
        },
        response:
        {
            200:
            {
                type: "object",
                required: [ "valid" ],
                additionalProperties: false,
                properties:
                {
                    "valid": { type: "boolean" }
                }
            }
        }
    };
    app.get("/validate", { schema: VALIDATE_SCHEMA, config: { api: true, access: "public" } }, async (req, res) =>
    {
        return { valid: req.query.login == config.application.login && req.query.password == config.application.password };
    });

    const LOGIN_SCHEMA =
    {
        body:
        {
            type: "object",
            required: [ "login", "password", "authentication" ],
            additionalProperties: false,
            properties:
            {
                "login": { $ref: "login" },
                "password": { $ref: "password" },
                "authentication": { $ref: "authentication" }
            }
        }
    };
    app.post("/login", { schema: LOGIN_SCHEMA, config: { authentication: true, access: "public" } }, async (req, res) =>
    {
        await res.createSessionID(req.body.login, req.body.password);
        return res.status(303).redirect("/bonusbuy");
    });


    app.get("/logout", { config: { access: "authorization" } }, async (req, res) =>
    {
        await res.removeSessionID();
        return res.status(301).redirect("/");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });