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

    document.getElementById('timer').textContent = time;
}

document.getElementById('settings').addEventListener('click',
    event => browser.runtime.openOptionsPage());

// TEMP TODO: get rid of temp
updateClock(0);
