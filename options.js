function loadBlacklist() {
    var select = document.querySelector('#blacklist');

    function showBlacklist(result) {
        console.log(result);
        console.log(result.blacklist);
        for (let i = 0; i < result.blacklist.length; i++) {
            console.log(result.blacklist[i]);
            select.appendChild(new Option(result.blacklist[i], result.blacklist[i]));
        }
    }

    while (select.hasChildNodes()) {
        select.removeChild(select.lastChild);
    }
    var getting = browser.storage.local.get("blacklist");
    getting.then(showBlacklist, onError);
}

function appendBlacklist(e) {
    e.preventDefault();
    var newBlacklist = [];
    var input = document.querySelector('#addition');

    function getBlacklist(result) {
        newBlacklist = updateBlacklist(result.blacklist, input.value);
        input.value = '';
        var setting = browser.storage.local.set({
            blacklist: newBlacklist
        });
        setting.then(function(result) {loadBlacklist();}, onError);
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    var getting = browser.storage.local.get("blacklist");
    getting.then(getBlacklist, onError);
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

    function removeSelected(result) {
        console.log(removal);
        var newBlacklist = result.blacklist;
        for (let i = 0; i < removal.length; i++) {
            // Subtract the number of already removed elements due to shortened array.
            newBlacklist.splice(removal[i] - i, 1);
        }
        var setter = browser.storage.local.set({
            blacklist: newBlacklist
        });
        setter.then(function(result) {loadBlacklist();}, onError);
    }

    var getting = browser.storage.local.get("blacklist");
    getting.then(removeSelected, onError);
}

function updateBlacklist(existList, addition) {
    console.log(existList);
    console.log("addition: " + addition);
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
document.querySelector("form").addEventListener("submit", appendBlacklist);
