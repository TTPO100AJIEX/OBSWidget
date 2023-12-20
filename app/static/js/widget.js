const session_id = document.getElementById("session_id");

const min_x = document.getElementById("min_x").children[0];
const sum_deposit = document.getElementById("sum_deposit").children[0];
const bonus_amount = document.getElementById("bonus_amount").children[0];

const max_winning = document.getElementById("max_winning").children[0];
const min_winning = document.getElementById("min_winning").children[0];

var bonuses = [ ];
const mode = document.getElementById("mode");

const currencies = { ROUBLE: "₽", DOLLAR: "$", EURO: "€" };

const connection = new EventSource("/widget/data");
function dispatchEvent(type, data) { connection.dispatchEvent(Object.assign(new Event(type), { data })); }

connection.addEventListener("data", ev =>
{
    const data = JSON.parse(ev.data);

    session_id.hidden = (!data.is_on);
    
    min_x.hidden = (!data.is_on);
    sum_deposit.hidden = (!data.is_on);
    bonus_amount.hidden = (!data.is_on);

    min_winning.hidden = (!data.is_on);
    max_winning.hidden = (!data.is_on);
    
    mode.id = "mode";
    mode.hidden = (!data.is_on);
    mode.children[0].children[0].replaceChildren();
    mode.children[0].children[1].replaceChildren();
    
    bonuses = [ ];
    dispatchEvent("session_update", ev.data);
    for (const bonus of (data.bonuses ?? [ ])) dispatchEvent("insert_bonus", JSON.stringify(bonus));
});


connection.addEventListener("session_update", ev =>
{
    const data = JSON.parse(ev.data);
    session_id.innerText = data.id;
    sum_deposit.innerText = data.balance + currencies[data.currency];
    mode.id = data.mode ? data.mode.toLowerCase() + "_mode" : "mode";
});

function buildBonus(data, span = null)
{
    if (!span) span = document.createElement("span");
    
    const currency = currencies[data.currency];
    const parts = [ `${data.index}.`,  data.slot_name, `(${data.bet_size}${currency}) = ${data.winning ?? 0}${currency}` ];
    span.replaceChildren(...parts.map(part => { const text_part = document.createElement("span"); text_part.innerText = part; return text_part; }))

    const split_index = Math.max(data.index - 2, 0);
    if (data.is_active)
    {
        span.classList.add("active");
        mode.style.setProperty("--hidden-items", split_index);
        mode.children[0].children[1].children[split_index]?.classList.add("hide_after");
    }
    else
    {
        span.classList.remove("active");
        mode.children[0].children[1].children[split_index]?.classList.remove("hide_after");
    }
    return span;
}

function updateBonusStats()
{
    bonus_amount.innerText = bonuses.length;
    min_x.innerText = Math.min(...bonuses.filter(bonus => bonus.winning).map(bonus => bonus.winning / bonus.bet_size)).toFixed(2);

    const sorted = [ ...bonuses ].sort((a, b) => b.winning - a.winning);
    buildBonus(sorted.at(-1), min_winning);
    buildBonus(sorted[0], max_winning);
}

connection.addEventListener("insert_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses.push(data);
    updateBonusStats();
    mode.children[0].children[0].appendChild(buildBonus(data));
    mode.children[0].children[1].appendChild(buildBonus(data));
});

connection.addEventListener("update_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses[data.index - 1] = data;
    updateBonusStats();
    buildBonus(data, mode.children[0].children[0].children[data.index - 1]);
    buildBonus(data, mode.children[0].children[1].children[data.index - 1]);
});

connection.addEventListener("delete_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses.splice(data.index - 1, 1);
    updateBonusStats();
    mode.children[0].children[0].children[data.index - 1].remove();
    mode.children[0].children[1].children[data.index - 1].remove();
    for (let i = 0; i < bonuses.length; i++)
    {
        bonuses[i].index = i + 1;
        dispatchEvent("update_bonus", JSON.stringify(bonuses[i]));
    }
});
