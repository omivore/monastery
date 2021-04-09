// delays.js

// Load up current state; assume that variables are there
function loadDelays() {
    browser.storage.sync.get(['delays', 'delayOn']).then(result => {
        document.querySelector('#delayLength').value = result.delays;
        document.querySelector('#delaySwitch').checked = result.delayOn;
        document.querySelector('#delayLength').disabled = !result.delayOn;
    });
}

// Rig up checkmark toggling functionality
document.querySelector('#delaySwitch').addEventListener('change', event => {
    browser.storage.sync.set({delayOn: event.target.checked});
    loadDelays();
});

// Rig up delay length functionality
document.querySelector('#delayLength').addEventListener('change', event => {
    browser.storage.sync.set({delays: event.target.value});
    loadDelays();
});

loadDelays();
