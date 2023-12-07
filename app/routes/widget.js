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
    app.get("/session/:session_id/widget", { schema: GET_SCHEMA, config: { access: "authorization" } }, async (req, res) =>
    {
        return res.render("widget.ejs");
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });