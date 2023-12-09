import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class DataWidgetEvent extends WidgetEvent
{
    static type = "data";
    
    async getData()
    {
        const bonuses_query_string = `SELECT index, slot_name, bet_size, currency, winning FROM bonuses_view WHERE session_id = %L`;
        const session_query_string = `SELECT id, balance, currency, mode, is_on FROM sessions_view WHERE id = %L`;
        const batch = new Database.AnonymousBatch();
        batch.execute(Database.format(bonuses_query_string, this.session_id));
        batch.execute({ query: Database.format(session_query_string, this.session_id), one_response: true });
        const [ bonuses, session ] = await batch.commit();
        if (!session.is_on) return undefined;
        return { ...session, bonuses };
    }
};