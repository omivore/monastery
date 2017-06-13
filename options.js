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

    function onError(error) {
        console.log(`Error: ${error}`);
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
        newBlacklist = result.blacklist;
        newBlacklist.push(input.value);
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

document.addEventListener("DOMContentLoaded", loadBlacklist);
document.querySelector("form").addEventListener("submit", appendBlacklist);
