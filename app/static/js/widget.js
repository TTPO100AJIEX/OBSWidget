const start_mode = document.getElementById("start_mode");

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
setTimeout(fourth, 7500);