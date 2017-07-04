// blacklist.js

function loadBlacklist() {
    var select = document.querySelector('#sites select');

    while (select.hasChildNodes())
        select.removeChild(select.lastChild);

    browser.storage.sync.get('blacklist').then(result => {
        for (let i = 0; i < result.blacklist.length; i++)
            select.appendChild(new Option(result.blacklist[i], result.blacklist[i]));

        // Adjust size of multiple select form to list + 1, with min of 5 and max of 10
        select.size = Math.max(5, Math.min(result.blacklist.length + 1, 9));
    });
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
        console.log(`Storing new blacklist of ${newBlacklist}`);
        setter.then(result => loadBlacklist());
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
    document.querySelector('#sites #errorField').classList.add('shown');
    // Once the animation is done, remove the class
    setTimeout(() => {
        document.querySelector('#sites #errorField').textContent = '';
        document.querySelector('#sites #errorField').classList.remove('shown');
    }, 1000);
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
