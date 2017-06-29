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

/// Initialization and Setup

document.addEventListener("DOMContentLoaded", function(e) {
    loadBlacklist();
    loadTimeout();
});
document.querySelector('button').addEventListener("click", removeBlacklist);
document.querySelector("#sites").addEventListener("submit", function(e) {
    e.preventDefault();
    appendBlacklist();
});
document.querySelector("#settings").addEventListener("submit", function(e) {
    e.preventDefault();
    saveTimeout();
});
