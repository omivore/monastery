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
        for (let key in vars.blockgroups) {
            bg.appendChild(newBlockgroupEntry(vars.blockgroups[key]));
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

function refreshOptions() {
    var hasCurrent;
    // If there's no 'currently selected', pick the first one
    // Assumes there is always at least one blockgroup
    if (currentBlockgroup == null) {
        hasCurrent = browser.storage.local.get('blockgroups').then(vars => {
            currentBlockgroup = vars.blockgroups[bg.firstChild.dataset.id];
            return currentBlockgroup;
        });
    } else {
        hasCurrent = Promise.resolve(currentBlockgroup);
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
    entry.addEventListener('click', e => {
        // Make this one the selected group
        browser.storage.local.get('blockgroups')
            .then(vars => selectGroup(vars.blockgroups[blockgroup.id]));
    });
    var title = document.createElement('h4');
    title.appendChild(document.createTextNode(blockgroup.name));
    var closeBtn = document.createElement('span');
    closeBtn.classList.add('close_button');
    closeBtn.classList.add('red');
    closeBtn.addEventListener('click', e => {
        // Remove this blockgroup
        browser.storage.local.get('blockgroups')
            .then(vars => {
                console.log("Removing");
                delete vars.blockgroups[blockgroup.id];
                browser.storage.local.set({
                    blockgroups: vars.blockgroups
                })
                .then(updateBlockgroups)
                .then(selectGroup);
            })
    });
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

// Selects the blockgroup in the blockgroup select. Defaults to first group
function selectGroup(blockgroup) {
    // Empty call means selectGroup default
    if (typeof blockgroup == "undefined") {
        console.log("Selecting default blockgroup");
        return browser.storage.local.get('blockgroups')
            .then(vars => vars.blockgroups[bg.firstChild.dataset.id])
            .then(target => selectGroup(target));
    }

    // Standard call to selectGroup
    console.log(`Selecting blockgroup id ${blockgroup.id} "${blockgroup.name}"`);

    // De-select last group, if there was a last group
    let last = document.querySelector('.selected');
    if (last != null) last.classList.remove('selected');

    // Select current group
    let next = document.querySelector(`#blockgroup_select div[data-id="${blockgroup.id}"]`);
    if (next != null) next.classList.add('selected');
    else console.error(`Blockgroup with id '${blockgroup.id}' could not be found`);

    // Assign currentBlockgroup
    currentBlockgroup = blockgroup;
console.log(currentBlockgroup);

    // Update the views
    return refreshOptions();
}

/**********     Button control functions        **********/
document.querySelector('#blockgroups input').addEventListener('click', () => {
    console.log("Adding new blockgroup");

    // Add the blockgroup then tell options to update
    let newGroup = Blockgroup([], 30, [], true, 30, false);
    updateBlockgroup(newGroup)
        .then(updateBlockgroups)
        .then(() => selectGroup(newGroup));
});
name.addEventListener('input', () => {
    currentBlockgroup.name = name.value;
    updateBlockgroup(currentBlockgroup)
        .then(updateBlockgroups)
        .then(() => selectGroup(currentBlockgroup));
});

// Initialize page
updateWhitelist();
updateBlockgroups().then(selectGroup);
