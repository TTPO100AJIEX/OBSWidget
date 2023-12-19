import UpdateBonusWidgetEvent from "./UpdateBonusWidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class ActiveBonusWidgetEvent extends UpdateBonusWidgetEvent
{
    async getData()
    {
        const bonuses_query_string = `SELECT * FROM bonuses_view WHERE session_id = $1 AND is_on AND is_active`;
        return await Database.execute(bonuses_query_string, [ this.session_id ], { one_response: true });
    }
};