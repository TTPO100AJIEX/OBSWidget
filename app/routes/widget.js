import WidgetEvent from './widget_events/WidgetEvent.js';
import DataWidgetEvent from './widget_events/DataWidgetEvent.js';

async function register(app, options)
{
    app.get("/widget", { config: { access: "public" } }, async (req, res) => res.render("widget.ejs"));

    app.get("/widget/data", { config: { access: "public" } }, async (req, res) =>
    {
        WidgetEvent.registerConnection(res, req.socket);
        await new DataWidgetEvent().dispatch(res);
        res.sse({ data: "OK" });
    });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'oauth-routes', encapsulate: false });