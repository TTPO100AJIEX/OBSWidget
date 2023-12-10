const min_x = document.getElementById("min_x");
const sum_deposit = document.getElementById("sum_deposit");
const bonus_amount = document.getElementById("bonus_amount");

const max_winning = document.getElementById("max_winning");
const min_winning = document.getElementById("min_winning");

const mode = document.getElementById("mode");

const connection = new EventSource(location.pathname + "/data");
function dispatchEvent(type, data)
{
    connection.dispatchEvent(Object.assign(new Event(type), { data }));
}

const nbsp_trusted_policy = trustedTypes.createPolicy("nbsp", { createHTML: input => input });
const nbsp = nbsp_trusted_policy.createHTML("&nbsp;");

var bonuses = [ ], is_on = false;

connection.addEventListener("error", ev =>
{
    console.log(ev);
});

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
    is_on = data.is_on;

    if (!is_on)
    {
        min_x.innerHTML = nbsp;
        sum_deposit.innerHTML = nbsp;
        bonus_amount.innerHTML = nbsp;

        min_winning.innerHTML = nbsp;
        max_winning.innerHTML = nbsp;
        
        for (const child of mode.children) child.remove();
        mode.id = "mode";
        return;
    }

    const id = data.mode.toLowerCase() + "_mode";
    sum_deposit.innerText = data.balance;
    if (mode.id != id)
    {
        mode.id = id;
        mode.replaceChildren();
        
        if (id == "main_mode")
        {
            const container = mode.appendChild(document.createElement("div"));
            container.appendChild(document.createElement("div"));
            container.appendChild(document.createElement("div"));
        }

        const save_bonuses = bonuses;
        bonuses = [ ];
        for (const bonus of save_bonuses) dispatchEvent("insert_bonus", JSON.stringify(bonus));
    }
});


const currencies = { ROUBLE: "₽", DOLLAR: "$", EURO: "€" };
function buildBonusText({ index, slot_name = "", bet_size, currency, winning } = { })
{
    currency = currencies[currency];
    if (slot_name.length > 17) slot_name = slot_name.slice(0, 17) + "...";
    return `${index}. ${slot_name} (${bet_size}${currency}) = ${winning ?? 0}`;
}

function buildBonus(data, span = null)
{
    if (!span) span = document.createElement("span");
    span.innerText = buildBonusText(data);
    if (data.is_active)
    {
        span.classList.add("active");
        mode.style.setProperty("--hidden-items", data.index - 2);
    }
    else
    {
        span.classList.remove("active");
    }
    return span;
}

function updateBonusStats()
{
    bonus_amount.innerText = bonuses.length;
    min_x.innerText = Math.min(...bonuses.map(bonus => bonus.winning / bonus.bet_size)).toFixed(2);

    const sorted = bonuses.toSorted((a, b) => b.winning - a.winning);
    buildBonus(sorted.at(-1), min_winning);
    buildBonus(sorted[0], max_winning);
}

connection.addEventListener("insert_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses.push(data);
    updateBonusStats();
    switch (mode.id)
    {
        case "main_mode":
            mode.children[0].children[0].appendChild(buildBonus(data));
            mode.children[0].children[1].appendChild(buildBonus(data));
            break;
        case "start_mode":
            mode.appendChild(buildBonus(data));
            break;
    }
});

connection.addEventListener("update_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses[data.index - 1] = data;
    updateBonusStats();
    switch (mode.id)
    {
        case "main_mode":
            buildBonus(data, mode.children[0].children[0].children[data.index - 1]);
            buildBonus(data, mode.children[0].children[1].children[data.index - 1]);
            break;
        case "start_mode":
            buildBonus(data, mode.children[data.index - 1]);
            break;
    }
});

connection.addEventListener("delete_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses.splice(data.index - 1, 1);
    updateBonusStats();
    switch (mode.id)
    {
        case "main_mode":
            mode.children[0].children[0].children[data.index - 1].remove();
            mode.children[0].children[1].children[data.index - 1].remove();
            break;
        case "start_mode":
            mode.children[data.index - 1].remove();
            break;
    }
    for (let i = 0; i < bonuses.length; i++)
    {
        bonuses[i].index = i + 1;
        dispatchEvent("update_bonus", JSON.stringify(bonuses[i]));
    }
});
