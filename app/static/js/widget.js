const min_x = document.getElementById("min_x");
const sum_deposit = document.getElementById("sum_deposit");
const bonus_amount = document.getElementById("bonus_amount");

const max_winning = document.getElementById("max_winning");
const min_winning = document.getElementById("min_winning");

const mode = document.getElementById("mode");

const currencies = { ROUBLE: "₽", DOLLAR: "$", EURO: "€" };
function buildBonus({ index, slot_name = "", bet_size, currency, winning } = { })
{
    currency = currencies[currency];
    if (slot_name.length > 17) slot_name = slot_name.slice(0, 17) + "...";
    return `${index}. ${slot_name} (${bet_size}${currency}) = ${winning}`;
}

const connection = new EventSource(location.pathname + "/data");
function dispatchEvent(type, data)
{
    connection.dispatchEvent(Object.assign(new Event(type), { data }));
}

const nbsp_trusted_policy = trustedTypes.createPolicy("nbsp", { createHTML: input => input });
const nbsp = nbsp_trusted_policy.createHTML("&nbsp;");

var bonuses = [ ], is_on = false;

connection.addEventListener("data", ev =>
{
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
        for (const child of mode.children) child.remove();
        
        if (id == "main_mode")
        {
            const main_mode_container = document.createElement("div");
            mode.appendChild(main_mode_container);
            
            const container1 = document.createElement("div");
            const container2 = document.createElement("div");
            main_mode_container.appendChild(container1);
            main_mode_container.appendChild(container2);
            
            const save_bonuses = bonuses;
            bonuses = [ ];
            for (const bonus of save_bonuses) dispatchEvent("insert_bonus", JSON.stringify(bonus));
        }
    }
});


function updateBonusStats()
{
    bonus_amount.innerText = bonuses.length;
    min_x.innerText = Math.min(...bonuses.map(bonus => bonus.winning / bonus.bet_size)).toFixed(2);

    const sorted = bonuses.toSorted((a, b) => b.winning - a.winning);
    min_winning.innerText = buildBonus(sorted.at(-1));
    max_winning.innerText = buildBonus(sorted[0]);
}

connection.addEventListener("insert_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    bonuses.push(data);
    updateBonusStats();

    switch (mode.id)
    {
        case "main_mode":
        {
            const span = document.createElement("span");
            span.innerText = buildBonus(data);
            const copy = span.cloneNode(true);

            mode.children[0].children[0].appendChild(span);
            mode.children[0].children[1].appendChild(copy);
            break;
        }
        case "start_mode":
        {
            // TODO
            break;
        }
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
        {
            const span = mode.children[0].children[0].children[data.index - 1];
            const copy = mode.children[0].children[1].children[data.index - 1];
            span.innerText = copy.innerText = buildBonus(data);
            break;
        }
        case "start_mode":
        {
            // TODO
            break;
        }
    }
});

connection.addEventListener("delete_bonus", ev =>
{
    const data = JSON.parse(ev.data);
    console.log(data);
    bonuses.splice(data.index - 1, 1);
    updateBonusStats();

    switch (mode.id)
    {
        case "main_mode":
        {
            mode.children[0].children[0].children[data.index - 1].remove();
            mode.children[0].children[1].children[data.index - 1].remove();
            for (let i = 0; i < bonuses.length; i++)
            {
                bonuses[i].index = i + 1;
                dispatchEvent("update_bonus", JSON.stringify(bonuses[i]));
            }
            break;
        }
        case "start_mode":
        {
            // TODO
            break;
        }
    }
});



/*const start_mode = document.getElementById("start_mode");

function first()
{
    start_mode.children[0].classList.add("highlight");
}
function second()
{
    start_mode.children[0].classList.remove("highlight");
    start_mode.children[1].classList.add("highlight");
}
function third()
{
    start_mode.style.setProperty("--hidden-items", 1);
    start_mode.children[1].classList.remove("highlight");
    start_mode.children[2].classList.add("highlight");
}
function fourth()
{
    start_mode.style.setProperty("--hidden-items", 2);
    start_mode.children[2].classList.remove("highlight");
    start_mode.children[3].classList.add("highlight");
}

setTimeout(first, 1000);
setTimeout(second, 2500);
setTimeout(third, 5000);
setTimeout(fourth, 7500);*/