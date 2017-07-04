function updateClock(secondsRemaining) {
    var time = '';
    var hours = Math.floor(secondsRemaining / 3600);
    hours = (hours < 10) ? `0${hours}` : hours;
    secondsRemaining %= 3600;

    var minutes = Math.floor(secondsRemaining / 60);
    minutes = (minutes < 10) ? `0${minutes}` : minutes;
    secondsRemaining %= 60;

    var seconds = (secondsRemaining < 10) ? `0${secondsRemaining}` : secondsRemaining;
    document.querySelector('#timer').textContent = `${hours}:${minutes}:${seconds}`;
}

document.querySelector('#settings').addEventListener('click',
     event => browser.runtime.openOptionsPage());
browser.runtime.onMessage.addListener(message => updateClock(message.timeRemaining));

// On open, show whatever time is currently stored and available.
browser.storage.sync.get('hourglass').then(result => updateClock(result.hourglass));
