// blocking.js

function loadTimeout() {
    browser.storage.sync.get('timeout').then(result => {
        document.querySelector('#hours').value = Math.floor(result.timeout / 60);
        document.querySelector('#minutes').value = Math.floor(result.timeout % 60);
    });

    // Clear the save status; this is the current version.
    document.querySelector('#saveState').textContent = '';
}

function saveTimeout() {
    var timeLeft = parseInt(document.querySelector('#hours').value) * 60 +
                   parseInt(document.querySelector('#minutes').value);
    // Set a minimum and maximum of 1 minute and 23 hours, 59 minutes
    timeLeft = Math.max(1, Math.min((23 * 60) + 59, timeLeft));
    browser.storage.sync.set({timeout: timeLeft});
    console.log(`Storing new timeout of ${timeLeft} minutes`);

    // Update status to saved
    document.querySelector('#saveState').textContent = 'saved';
    document.querySelector('#saveState').classList = 'saved';
}

function showEdited() {
    document.querySelector('#saveState').textContent = 'edited';
    document.querySelector('#saveState').classList = 'edited';
}
document.querySelector('#hours').addEventListener('input', showEdited);
document.querySelector('#minutes').addEventListener('input', showEdited);

document.addEventListener('DOMContentLoaded', event => loadTimeout());
document.querySelector('#settings').addEventListener('submit', event => {
    event.preventDefault();
    approveEdit().then(approved => {
        if (approved) saveTimeout();
    });
});
