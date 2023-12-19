export default class WidgetEvent
{
    static connections = [ ];
    static get type() { throw 'WidgetEvent::type - Not Implemented'; }
    static async registerConnection(connection, socket)
    {
        this.connections.push(connection);
        socket.on('close', () => connection.closed = true);
    }

    async getData() { throw 'WidgetEvent::getData - Not Implemented'; }

    async dispatch(connection)
    {
        const data = JSON.stringify(await this.getData());
        const event = this.constructor.type;
        if (!data) return;
        
        WidgetEvent.connections = WidgetEvent.connections.filter(connection => !connection.closed);

        if (connection) return connection.sse({ event, data });
        for (const connection of WidgetEvent.connections) connection.sse({ event, data });
    }
};