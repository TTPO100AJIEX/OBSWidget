import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class InsertBonusWidgetEvent extends WidgetEvent
{
    static type = "insert_bonus";
    
    async getData()
    {
        const bonuses_query_string = `SELECT index, slot_name, bet_size, currency, winning FROM bonuses_view WHERE session_id = $1 ORDER BY id DESC LIMIT 1`;
        return await Database.execute(bonuses_query_string, [ this.session_id ], { one_response: true });
    }
};