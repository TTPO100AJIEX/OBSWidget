import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class SessionUpdateWidgetEvent extends WidgetEvent
{
    static type = "session_update";
    constructor(session_id) { super(); this.session_id = session_id; }
    
    async getData()
    {
        const session_query_string = `SELECT * FROM sessions_view WHERE id = $1 AND is_on`;
        return await Database.execute(session_query_string, [ this.session_id ], { one_response: true });
    }
};