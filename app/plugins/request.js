import config from "common/configs/config.json" assert { type: "json" };

import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import server_sent_events from "fastify-sse-v2";

async function register(app, options)
{
    /*----------------------------------FORMBODY----------------------------------*/
    await app.register(formbody, { bodyLimit: 1048576 });
    
    /*----------------------------------SERVER-SENT EVENTS----------------------------------*/
    await app.register(server_sent_events);

    /*----------------------------------COOKIE----------------------------------*/
    await app.register(cookie, { secret: config.website.secret });
}

import plugin from 'fastify-plugin';
export default plugin(register, { name: 'request', encapsulate: false });