import WidgetEvent from "./WidgetEvent.js";
import { Database } from "common/databases/PostgreSQL/PostgreSQL.js";

export default class DataWidgetEvent extends WidgetEvent
{
    static type = "data";
    
    async getData()
    {
        const batch = new Database.AnonymousBatch();
        batch.execute(`SELECT * FROM bonuses_view WHERE is_on`);
        batch.execute({ query: `SELECT * FROM sessions_view WHERE is_on`, one_response: true });
        const [ bonuses, session ] = await batch.commit();
        if (!session) return { is_on: false };
        return { ...session, bonuses };
    }
};