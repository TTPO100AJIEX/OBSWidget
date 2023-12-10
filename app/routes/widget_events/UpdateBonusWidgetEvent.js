import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class UpdateBonusWidgetEvent extends WidgetEvent
{
    static type = "update_bonus";

    constructor(session_id, bonus_id)
    {
        super(session_id);
        this.bonus_id = bonus_id;
    }
    
    async getData()
    {
        const bonuses_query_string = `SELECT * FROM bonuses_view WHERE session_id = $1 AND id = $2`;
        return await Database.execute(bonuses_query_string, [ this.session_id, this.bonus_id ], { one_response: true });
    }
};