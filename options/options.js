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
    var noteText = document.createElement("span");
    noteText.textContent = "minutes left, notify me.";

    if (result.notifications.length > 0) {
        document.querySelector("#notifications input[type=checkbox]").checked = true;

        // Populate the div with the existing notification times.
        var noteNode;
        for (let noteTime of result.notifications) {
            noteNode = createNotifyBox(noteTime);
            document.querySelector("#notifications div").appendChild(noteNode);
            document.querySelector("#notifications div").appendChild(noteText.cloneNode(true));
        }

        // Enable all relevant options
        setNotifications(true);
    } else {
        document.querySelector("#notifications input[type=checkbox]").checked = false;

        // Add the default, to-be-disabled notification
        let defaultNote = createNotifyBox(15);
        document.querySelector("#notifications div").appendChild(defaultNote);
        document.querySelector("#notifications div").appendChild(noteText.cloneNode(true));

        // Then disable all relevant options
        setNotifications(false);
    }
});
function createNotifyBox(defaultValue) {
    var noteBox = document.createElement("input");
    noteBox.setAttribute("type", "number");
    noteBox.setAttribute("min", "1");
    noteBox.setAttribute("value", defaultValue);
    noteBox.addEventListener("change", event => saveNotifications());
    return noteBox;
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
    document.querySelector("#notifications input[type=number]").disabled = !shouldBeEnabled;
    if (shouldBeEnabled) {
        document.querySelector("#notifications div span").classList.remove("notesDisabled");
        document.querySelector("#notifications div p").classList.remove("notesDisabled");
    }
    else {
        document.querySelector("#notifications div span").classList.add("notesDisabled");
    }
}

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
