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
    var getting = browser.storage.local.get("blacklist");
    getting.then(showBlacklist, onError);
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
        var setter = browser.storage.local.set({
            blacklist: newBlacklist
        });
        setter.then(function(result) {loadBlacklist();}, onError);
        browser.runtime.sendMessage({reload: true});
    }

    var getting = browser.storage.local.get("blacklist");
    getting.then(updateList, onError);
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

function onError(error) {
    console.log(`Error: ${error}`);
}

document.addEventListener("DOMContentLoaded", loadBlacklist);
document.querySelector('button').addEventListener("click", removeBlacklist);
document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();
    appendBlacklist();
});
