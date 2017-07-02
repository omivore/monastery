// options.js

/// Blacklist Sites

function loadBlacklist() {
    var select = document.querySelector('#blacklist');

    function showBlacklist(result) {
        for (let i = 0; i < result.blacklist.length; i++) {
            select.appendChild(new Option(result.blacklist[i], result.blacklist[i]));
        }
    }

    while (select.hasChildNodes()) {
        select.removeChild(select.lastChild);
    }
    var getting = browser.storage.sync.get("blacklist");
    getting.then(showBlacklist);
}

function appendBlacklist() {
    var newBlacklist = [];
    var input = document.querySelector('#addition');

    updateBlacklist(function(blacklist) {
        newBlacklist = validateList(blacklist, input.value);
        input.value = '';
        return newBlacklist;
    });
}

function removeBlacklist() {
    var removal = []
    var select = document.querySelector('#blacklist');
    for (let i = 0, option; i < select.length; i++) {
        option = select.options[i];
        if (option.selected) {
            removal.push(i);
        }
    }

    updateBlacklist(function(blacklist) {
        for (let i = 0; i < removal.length; i++) {
            // Subtract the number of already removed elements due to shortened array.
            blacklist.splice(removal[i] - i, 1);
        }
        return blacklist;
    });
}

function updateBlacklist(modify) {
    function updateList(result) {
        var newBlacklist = (typeof result.blacklist === 'undefined') ? [] : result.blacklist;
        newBlacklist = modify(newBlacklist);
        var setter = browser.storage.sync.set({
            blacklist: newBlacklist
        });
        setter.then(function(result) {loadBlacklist();});
        browser.runtime.sendMessage({reload: true});
    }

    var getting = browser.storage.sync.get("blacklist");
    getting.then(updateList);
}

function validateList(existList, addition) {
    var errorText = '';
    if (addition == '') {
        errorText = "No site provided."
    } else if (existList.indexOf(addition) != -1) {
        errorText = "Site is already on the list."
    } else {
        existList.push(addition);
    }

    document.querySelector('#errorField').innerHTML = errorText;
    return existList;
}

/// Blocking Settings

function loadTimeout() {
    browser.storage.sync.get("timeout").then(result => {
        document.querySelector("#hours").value = Math.floor(result.timeout / 60);
        document.querySelector("#minutes").value = Math.floor(result.timeout % 60);
    });

    // Clear the save status; this is the current version.
    document.querySelector("#saveState").innerHTML = "";
}

function saveTimeout() {
    var timeLeft = document.querySelector("#hours").value * 60 +
                   document.querySelector("#minutes").value;
    browser.storage.sync.set({timeout: timeLeft});

    // Update status to saved
    document.querySelector("#saveState").innerHTML = "saved";
    document.querySelector("#saveState").classList = "saved";
}

function showEdited() {
    document.querySelector("#saveState").innerHTML = "edited";
    document.querySelector("#saveState").classList = "edited";
}
document.querySelector("#hours").addEventListener("input", showEdited);
document.querySelector("#minutes").addEventListener("input", showEdited);

/// Notification Settings

// Load the notifications
browser.storage.sync.get("notifications").then(result => {
    let noticesExist = result.notifications.length > 0;

    document.querySelector("#notifications input[type=checkbox]").checked = noticesExist;
    // If there are notices, use the notification times, otherwise, use a default 15 minutes
    for (let noteTime of (noticesExist) ? result.notifications : [15])
        addNotifyEntry(noteTime);
    // Enable or disable the notifications area
    setNotifications(noticesExist);
});

// Solely adds another notification nubmer input and span text to the notifications div
function addNotifyEntry(noteTime) {
    var noticeDiv = document.createElement('div');

    var noticeNode = document.createElement("input");
    noticeNode.setAttribute("type", "number");
    noticeNode.setAttribute("min", "1");
    noticeNode.setAttribute("value", noteTime);
    noticeNode.addEventListener("change", event => saveNotifications());
    noticeDiv.appendChild(noticeNode);

    var noteText = document.createElement("span");
    noteText.textContent = "minutes left, notify me.";
    noticeDiv.appendChild(noteText);

    document.querySelector("#notifications div").appendChild(noticeDiv);
}

// Rig up checkbox functionality
document.querySelector("#notifications input[type=checkbox]").addEventListener("change", e => {
    if (document.querySelector("#notifications input[type=checkbox]").checked) {
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
    var savedTimes = [];
    for (let noteTime of document.querySelectorAll('#notifications input[type=number]'))
        savedTimes.push(noteTime.value);
    console.log("Saved times at " + savedTimes + " minute(s)");
    browser.storage.sync.set({notifications: savedTimes});
}

function setNotifications(shouldBeEnabled) {
    document.querySelector("#notifications input[type=submit]").disabled = !shouldBeEnabled;
    document.querySelector("#notifications input[type=button]").disabled = !shouldBeEnabled;
    for (let numInput of document.querySelectorAll("#notifications input[type=number]"))
        numInput.disabled = !shouldBeEnabled;

    if (shouldBeEnabled) {
        for (let paragraph of document.querySelectorAll("#notifications div span"))
            paragraph.classList.remove("notesDisabled");
        document.querySelector("#notifications div p").classList.remove("notesDisabled");
    }
    else {
        for (let paragraph of document.querySelectorAll("#notifications div span"))
            paragraph.classList.add("notesDisabled");
        document.querySelector("#notifications div p").classList.add("notesDisabled");
    }
}

// Add functionality for the add button
document.querySelector('#notifications').addEventListener('submit', event => {
    event.preventDefault();
    addNotifyEntry(15);
    saveNotifications();
});
// Add functionality for the remove button
document.querySelector('#notifications input[type=button]').addEventListener('click', event => {
    if (document.querySelectorAll('#notifications div div').length > 1) {
        document.querySelector('#notifications div')
            .removeChild(document.querySelector('#notifications div div:last-of-type'));
        saveNotifications();
    }
});

/// Initialization and Setup
document.addEventListener("DOMContentLoaded", function(e) {
    loadBlacklist();
    loadTimeout();
});
document.querySelector('button').addEventListener("click", function(e) {
    approveEdit().then(approved => {
        if (approved) removeBlacklist();
    });
});
document.querySelector("#sites").addEventListener("submit", function(e) {
    e.preventDefault();
    appendBlacklist();
});
document.querySelector("#settings").addEventListener("submit", function(e) {
    e.preventDefault();
    approveEdit().then(approved => {
        if (approved) saveTimeout();
    });
});

/// Disable select options if time is up for today
function approveEdit() {
    return browser.storage.sync.get("hourglass")
        .then(result => {
            if (result.hourglass == 0) {
                document.querySelector("#disabledNotice").classList.remove("hidden");
                return false;
            } else return true;
        });
}
