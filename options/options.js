// options/options.js

/**********     Constant input fields   **********/
let bg = document.getElementById('blockgroup_select');
let whitelist = document.querySelector('#whitelist select');
let name = document.querySelector('#blockgroup_name input');
let blacklist = document.querySelector('#blockgroup_blacklist select');
let hours = document.getElementById('hours');
let minutes = document.getElementById('minutes');
let delayCheck = document.querySelector('#blockgroup_delays .switch input');
let delay = document.querySelector('#blockgroup_delays input[type="number"]');
let noteCheck = document.querySelector('#blockgroup_notifications .switch input');
let notes = document.getElementById('notifications_select');

var currentBlockgroup = null;

/**********    Refreshing update methods  **********/
function updateBlockgroups() {
    return browser.storage.local.get('blockgroups').then(vars => {
        // Clear out bg
        while (bg.hasChildNodes()) bg.removeChild(bg.lastChild);

        // Repopulate
        var selected = false;
        for (let key in vars.blockgroups) {
            bg.appendChild(newBlockgroupEntry(vars.blockgroups[key]));

            if (!selected) {
                bg.firstChild.classList.add('selected');
                selected = true;
            }
        }
    });
}

function updateWhitelist() {
    return browser.storage.local.get('whitelist').then(vars => {
        // Clear out whitelist
        while (whitelist.hasChildNodes()) {
            whitelist.removeChild(whitelist.lastChild);
        }

        // Repopulate
        for (let i = 0; i < vars.whitelist.length; i++) {
            whitelist.appendChild(new Option(vars.whitelist[i]));
        }

        // Adjust select size to 5 <= list length < 10
        whitelist.size = Math.max(5, Math.min(vars.whitelist.length + 1, 9));
    });
}

function updateBlockgroup() {
    var hasCurrent;
    // If there's no 'currently selected', pick the first one
    // Assumes there is always at least one blockgroup
    if (currentBlockgroup == null) {
        hasCurrent = browser.storage.local.get('blockgroups').then(vars => {
            currentBlockgroup = vars.blockgroups[bg.firstChild.dataset.id];
            return currentBlockgroup;
        });
    } else {
        hasCurrent = new Promise((pass, fail) => currentBlockgroup);
    }

    hasCurrent.then(() => {
        updateName();
        updateBlacklist();
        updateTime();
        updateDelay();
        updateNotifications();
    });
}

function updateName() {
    name.value = currentBlockgroup.name;
}

function updateBlacklist() {
    // Clear out blacklist
    while (blacklist.hasChildNodes()) {
        blacklist.removeChild(blacklist.lastChild);
    }

    // Repopulate
    for (let i = 0; i < currentBlockgroup.blacklist.length; i++) {
        blacklist.appendChild(new Option(currentBlockgroup.blacklist[i]));
    }

    // Adjust select size to 5 <= list length < 10
    blacklist.size = Math.max(5, Math.min(currentBlockgroup.blacklist.length + 1, 9));
}

function updateTime() {
    let timePermitted = currentBlockgroup.allottedTime;

    let hourAllowed = Math.floor(timePermitted / 60);
    timePermitted %= 60;
    let minutesAllowed = timePermitted;

    hours.value = hourAllowed;
    minutes.value = minutesAllowed;
}

function updateDelay() {
    delayCheck.checked = currentBlockgroup.delay.isDelayActive;
    delay.value = currentBlockgroup.delay.delay;
}

function updateNotifications() {
    noteCheck.checked = currentBlockgroup.notifications.isNotificationsActive;

    // Clear out bg
    while (notes.hasChildNodes()) notes.removeChild(notes.lastChild);

    // Repopulate
    for (let notification of currentBlockgroup.notifications.notifications) {
        notes.appendChild(newNotificationEntry(currentBlockgroup, notification));
    }
}

/**********    HTML child creation methods  **********/
// Create a new entry in blockgroups
function newBlockgroupEntry(blockgroup) {
    var entry = document.createElement('div');
    entry.classList.add('entry');
    entry.setAttribute('data-id', blockgroup.id);
    var title = document.createElement('h4');
    title.appendChild(document.createTextNode(blockgroup.name));
    var closeBtn = document.createElement('span');
    closeBtn.classList.add('close_button');
    closeBtn.classList.add('red');
    closeBtn.appendChild(document.createTextNode('×'));

    entry.appendChild(title);
    entry.appendChild(closeBtn);

    return entry;
}

function newNotificationEntry(blockgroup, noteTime) {
    var entry = document.createElement('div');
    entry.classList.add('entry');
    var setting = document.createElement('input');
    setting.setAttribute('type', 'number');
    setting.value = noteTime;
    var closeBtn = document.createElement('span');
    closeBtn.classList.add('close_button');
    closeBtn.classList.add('red');
    closeBtn.appendChild(document.createTextNode('×'));

    entry.appendChild(setting);
    entry.appendChild(closeBtn);

    return entry;
}

function selectGroup(blockgroup) {
    currentBlockgroup = blockgroup;
    document.querySelector('.selected').classList.remove('selected');
    document.querySelector(`#blockgroup_select div[data-id="${blockgroup.id}"]`)
        .classList.add('selected');
}

// Initialize page
updateWhitelist();
updateBlockgroups().then(updateBlockgroup);
