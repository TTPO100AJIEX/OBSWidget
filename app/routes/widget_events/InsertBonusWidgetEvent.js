import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class InsertBonusWidgetEvent extends WidgetEvent
{
    static type = "insert_bonus";
    constructor(session_id) { super(); this.session_id = session_id; }
    
    async getData()
    {
        const bonuses_query_string = `SELECT * FROM bonuses_view WHERE session_id = $1 AND is_on ORDER BY id DESC LIMIT 1`;
        return await Database.execute(bonuses_query_string, [ this.session_id ], { one_response: true });
    }
};