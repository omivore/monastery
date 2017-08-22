// blocking.js

function loadTimeout() {
    browser.storage.sync.get('timeout').then(result => {
        document.querySelector('#hours').value = Math.floor(result.timeout / 60);
        document.querySelector('#minutes').value = Math.floor(result.timeout % 60);
    });

    // Clear the save status; this is the current version.
    document.querySelector('#saveState').textContent = '';
}

function getNewTimeout() {
    var newTimeout = parseInt(document.querySelector('#hours').value) * 60 +
                   parseInt(document.querySelector('#minutes').value);

    // Set a minimum and maximum of 1 minute and 23 hours, 59 minutes
    newTimeout = Math.max(1, Math.min((23 * 60) + 59, newTimeout));
    return newTimeout;
}

function saveTimeout(newTimeout) {
    browser.storage.sync.set({timeout: newTimeout});
    console.log(`Storing new timeout of ${newTimeout} minutes`);

    // Special case: if hourglass > newTimeout,
    // update hourglass and timeRemaining so this takes effect immediately.
    browser.storage.sync.get('hourglass').then(result => {
        if (result.hourglass > newTimeout * 60) {
            browser.storage.sync.set({hourglass: newTimeout * 60});
            browser.extension.getBackgroundPage()
                .timeRemaining = newTimeout * 60;
        }
    });

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

    // Before considering approval: if lowering the timeout, it's permitted
    browser.storage.sync.get('timeout').then(result => {
        let newTimeout = getNewTimeout();
        if (result.timeout >= newTimeout)
            saveTimeout(newTimeout);
        else {
            // If raising the timeout, *then* see if it's permitted
            approveEdit().then(approved => {
                if (approved) saveTimeout(getNewTimeout());
            });
        }
    });
});
