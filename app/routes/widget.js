import WidgetEvent from './widget_events/WidgetEvent.js';
import DataWidgetEvent from './widget_events/DataWidgetEvent.js';

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
    app.get("/session/:session_id/widget", { schema: GET_SCHEMA, config: { access: "public" } }, async (req, res) => res.render("widget.ejs"));

    
    const SSE_SCHEMA =
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
    app.get("/session/:session_id/widget/data", { schema: SSE_SCHEMA, config: { access: "public" } }, async (req, res) =>
    {
        WidgetEvent.registerConnection(res, req.socket, req.params.session_id);
        await new DataWidgetEvent(req.params.session_id).dispatch(res);
        res.sse({ data: "OK" });
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });