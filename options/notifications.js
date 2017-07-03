// notifications.js

// Load the notifications
function loadNotifications() {
    browser.storage.sync.get('notifications').then(result => {
        let noticesExist = result.notifications.length > 0;

        document.querySelector('#notifications input[type=checkbox]').checked = noticesExist;
        // If there are notices, use those times, otherwise, use a default 15 minutes
        for (let noteTime of (noticesExist) ? result.notifications : [15])
            addNotifyEntry(noteTime);

        // Enable or disable the notifications area
        setNotifications(noticesExist);
    });
}

// Solely adds another notification nubmer input and span text to the notifications div
function addNotifyEntry(noteTime) {
    var noticeDiv = document.createElement('div');

    var noticeNode = document.createElement('input');
    noticeNode.setAttribute('type', 'number');
    noticeNode.setAttribute('min', '1');
    noticeNode.setAttribute('value', noteTime);
    noticeNode.addEventListener('change', event => saveNotifications());
    noticeDiv.appendChild(noticeNode);

    var noteText = document.createElement('span');
    noteText.textContent = 'minutes left, notify me.';
    noticeDiv.appendChild(noteText);

    document.querySelector('#notifications div').appendChild(noticeDiv);
}

// Rig up checkbox functionality
document.querySelector('#notifications input[type=checkbox]').addEventListener('change', event => {
    if (document.querySelector('#notifications input[type=checkbox]').checked) {
        // Enable notifications settings
        setNotifications(true);
        saveNotifications();
    } else {
        // Disable notification settings
        setNotifications(false);
        // Clear the notifications settings
        browser.storage.sync.set({notifications: []});
    }
});

// Save all the settings currently set on the options page
function saveNotifications() {
    var savedTimes = new Set();
    for (let noteTime of document.querySelectorAll('#notifications input[type=number]'))
        savedTimes.add(noteTime.value);
    savedTimes = [...savedTimes].filter(time => time >= 1).sort((left, right) => right - left);
    console.log(`Saved times at ${savedTimes} minute(s)`);
    browser.storage.sync.set({notifications: savedTimes});
}

function setNotifications(shouldBeEnabled) {
    for (let button of document.querySelectorAll('#notifications input[type=button]'))
        button.disabled = !shouldBeEnabled;
    for (let numInput of document.querySelectorAll('#notifications input[type=number]'))
        numInput.disabled = !shouldBeEnabled;

    if (shouldBeEnabled) {
        for (let paragraph of document.querySelectorAll('#notifications div span'))
            paragraph.classList.remove('notesDisabled');
        document.querySelector('#notifications div p').classList.remove('notesDisabled');
    }
    else {
        for (let paragraph of document.querySelectorAll('#notifications div span'))
            paragraph.classList.add('notesDisabled');
        document.querySelector('#notifications div p').classList.add('notesDisabled');
    }
}

// Add functionality for the add button
document.querySelector('#notifications input[value=Add]').addEventListener('click', event => {
    addNotifyEntry(15);
    saveNotifications();
});
// Add functionality for the remove button
document.querySelector('#notifications input[value=Remove]').addEventListener('click', event => {
    if (document.querySelectorAll('#notifications div div').length > 1) {
        document.querySelector('#notifications div')
            .removeChild(document.querySelector('#notifications div div:last-of-type'));
        saveNotifications();
    }
});

document.addEventListener('DOMContentLoaded', event => loadNotifications());
