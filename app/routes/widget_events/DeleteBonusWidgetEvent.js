import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class DeleteBonusWidgetEvent extends WidgetEvent
{
    static type = "delete_bonus";

    constructor(session_id, bonus_id)
    {
        super(session_id);
        this.bonus_id = bonus_id;
    }
    
    async getData()
    {
        const bonuses_query_string = `SELECT COALESCE(MIN(index) FILTER (WHERE id > $2), MAX(index) + 1) AS index FROM bonuses_view WHERE session_id = $1`;
        return await Database.execute(bonuses_query_string, [ this.session_id, this.bonus_id ], { one_response: true });
    }
};