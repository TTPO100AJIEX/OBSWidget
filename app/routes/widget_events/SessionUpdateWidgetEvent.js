import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class SessionUpdateWidgetEvent extends WidgetEvent
{
    static type = "session_update";
    
    async getData()
    {
        const session_query_string = `SELECT id, balance, currency, mode, is_on FROM sessions_view WHERE id = $1`;
        return await Database.execute(session_query_string, [ this.session_id ], { one_response: true });
    }
};