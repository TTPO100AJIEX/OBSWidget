const min_x = document.getElementById("min_x").children[0];
const sum_deposit = document.getElementById("sum_deposit").children[0];
const bonus_amount = document.getElementById("bonus_amount").children[0];

const max_winning = document.getElementById("max_winning").children[0];
const min_winning = document.getElementById("min_winning").children[0];

var bonuses = [ ];
const mode = document.getElementById("mode");

const currencies = { ROUBLE: "₽", DOLLAR: "$", EURO: "€" };

const connection = new EventSource(location.pathname + "/data");
function dispatchEvent(type, data) { connection.dispatchEvent(Object.assign(new Event(type), { data })); }

connection.addEventListener("data", ev =>
{
    bonuses = [ ];
    mode.id = "mode";
    const data = JSON.parse(ev.data);
    dispatchEvent("session_update", ev.data);
    for (const bonus of data.bonuses) dispatchEvent("insert_bonus", JSON.stringify(bonus));
});


connection.addEventListener("session_update", ev =>
{
    const data = JSON.parse(ev.data);
    sum_deposit.innerText = data.balance + currencies[data.currency];
    mode.id = data.mode.toLowerCase() + "_mode";

    if (!data.is_on)
    {
        min_x.hidden = true;
        sum_deposit.hidden = true;
        bonus_amount.hidden = true;

        min_winning.hidden = true;
        max_winning.hidden = true;
        
        mode.hidden = true;
    }
    else
    {
        min_x.hidden = false;
        sum_deposit.hidden = false;
        bonus_amount.hidden = false;

        min_winning.hidden = false;
        max_winning.hidden = false;
        
        mode.hidden = false;
    }
});


function buildBonusText({ index, slot_name = "", bet_size, currency, winning } = { })
{
    currency = currencies[currency];
    if (slot_name.length > 17) slot_name = slot_name.slice(0, 17) + "...";
    return `${index}. ${slot_name} (${bet_size}${currency}) = ${winning ?? 0}${currency}`;
}

function buildBonus(data, span = null)
{
    if (!span) span = document.createElement("span");
    const split_index = Math.max(data.index - 2, 0);
    span.innerText = buildBonusText(data);
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

    const sorted = bonuses.toSorted((a, b) => b.winning - a.winning);
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
