// delays.js

// Load up current state; assume that variables are there
function loadDelays() {
    browser.storage.sync.get(['delays', 'delayOn']).then(result => {
        document.querySelector('#delayLength input').value = result.delays / 60;
        document.querySelector('#delaySwitch input').checked = result.delayOn;
        document.querySelector('#delayLength input').disabled = !result.delayOn;
    });
}

// Rig up checkmark toggling functionality
document.querySelector('#delaySwitch input').addEventListener('change', event => {
    browser.storage.sync.set({delayOn: event.target.checked});
    loadDelays();
});

// Rig up delay length functionality
document.querySelector('#delayLength input').addEventListener('change', event => {
    browser.storage.sync.set({delays: event.target.value * 60});
    loadDelays();
});

loadDelays();
