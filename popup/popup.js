function updateClock(secondsLeft) {
    var time = '';
    var hours = Math.floor(secondsLeft / 3600);
    secondsLeft %= 3600;
    time += ((hours < 10) ? `0${hours}` : hours) + ':';

    var minutes = Math.floor(secondsLeft / 60);
    secondsLeft %= 60;
    time += ((minutes < 10) ? `0${minutes}` : minutes) + ':';

    var seconds = (secondsLeft < 10) ? `0${secondsLeft}` : secondsLeft;
    time += seconds;

    return time;
}

function addTimer(blockgroup) {
    var name = document.createElement("p");
    name.appendChild(document.createTextNode(blockgroup.name));
    name.classList.add("name");

    var timer = document.createElement("p");
    timer.appendChild(document.createTextNode(
        updateClock(blockgroup.hourglass.timeLeft)
    ));
    timer.classList.add("timer");

    var expiry = document.createElement("p");
    expiry.appendChild(document.createTextNode(
        // TODO: Use expirations here
        "Expires in "
    ));
    expiry.classList.add("expiry");

    var div = document.createElement("div");
    div.id = blockgroup.id;
    div.appendChild(name);
    div.appendChild(timer);
    div.appendChild(expiry);

    return div;
}

document.getElementById('settings').addEventListener('click',
    event => browser.runtime.openOptionsPage());

window.addEventListener('load', (event) => {
    let parent = document.getElementById('timers');
    browser.storage.local.get('blockgroups').then(vars => {
        for (let key in vars.blockgroups) {
            parent.appendChild(addTimer(vars.blockgroups[key]));
        }
    });
});
