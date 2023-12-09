export default class WidgetEvent
{
    static connections = new Map();
    static get type() { throw 'WidgetEvent::type - Not Implemented'; }
    static async registerConnection(connection, socket, session_id)
    {
        (this.connections[session_id] ??= [ ]).push(connection);
        socket.on('close', () => connection.closed = true);
    }

    constructor(session_id) { this.session_id = session_id; }
    async getData() { throw 'WidgetEvent::getData - Not Implemented'; }

    async dispatch(connection)
    {
        const data = JSON.stringify(await this.getData());
        const event = this.constructor.type;
        if (!data) return;
        
        WidgetEvent.connections[this.session_id] ??= [ ];
        WidgetEvent.connections[this.session_id] = WidgetEvent.connections[this.session_id].filter(connection => !connection.closed);
        
        if (connection) return connection.sse({ event, data });
        for (const connection of WidgetEvent.connections[this.session_id]) connection.sse({ event, data });
    }
};