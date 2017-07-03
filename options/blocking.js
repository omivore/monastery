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
    var timeLeft = document.querySelector('#hours').value * 60 +
                   document.querySelector('#minutes').value;
    browser.storage.sync.set({timeout: timeLeft});

    // Update status to saved
    document.querySelector('#saveState').innerHTML = 'saved';
    document.querySelector('#saveState').classList = 'saved';
}

function showEdited() {
    document.querySelector('#saveState').innerHTML = 'edited';
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
