// blacklist.js

function loadBlacklist() {
    var select = document.querySelector('#sites select');

    function showBlacklist(result) {
        for (let i = 0; i < result.blacklist.length; i++)
            select.appendChild(new Option(result.blacklist[i], result.blacklist[i]));
    }

    while (select.hasChildNodes())
        select.removeChild(select.lastChild);
    browser.storage.sync.get('blacklist').then(showBlacklist);
}

function appendBlacklist() {
    var newBlacklist = [];
    var input = document.querySelector('#sites input[type=text]');

    updateBlacklist(function(blacklist) {
        newBlacklist = validateList(blacklist, input.value);
        input.value = '';
        return newBlacklist;
    });
}

function removeBlacklist() {
    var removal = []
    var select = document.querySelector('#sites select');
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
        setter.then(result => loadBlacklist());
        browser.runtime.sendMessage({reload: true});
    }

    browser.storage.sync.get('blacklist').then(updateList);
}

function validateList(existList, addition) {
    var errorText = '';
    if (addition == '') {
        errorText = 'No site provided.'
    } else if (existList.indexOf(addition) != -1) {
        errorText = 'Site is already on the list.'
    } else {
        existList.push(addition);
    }

    document.querySelector('#sites #errorField').textContent = errorText;
    return existList;
}

document.addEventListener('DOMContentLoaded', event => loadBlacklist());
document.querySelector('#sites input[type=button]').addEventListener('click', event => {
    approveEdit().then(approved => {
        if (approved) removeBlacklist();
    });
});
document.querySelector('#sites').addEventListener('submit', event => {
    event.preventDefault();
    appendBlacklist();
});
