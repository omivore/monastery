// background.js
let timeAllowance = 1 * 60;

var hourglass = null;
var timeRemaining = timeAllowance;

function gatekeeper(event) {
    browser.storage.sync.get("hourglass").then(result => {
        if (result.hourglass != 0) {      // Permitted Stage
            isTresspassing().then(tresspass => {
                if (tresspass) {
                    // Start or continue timer
                    if (!hourglass) hourglass = setInterval(sandTick, 1000);
                } else {
                    // Stop timer and update hourglass
                    clearInterval(hourglass);
                    hourglass = null;
                    browser.storage.sync.set({hourglass: timeRemaining})
                        .catch(error => console.log(`Error: ${error}`));
                }
            });
        } else {                // Blocking Stage
            isTresspassing().then(tresspass => {
                if (tresspass) {
                    // Redirect tab to blocking page
                    blockAll();
                }
            });
        }
    });
}

function isTresspassing() {
    return getTresspassing(result => {
        // If result is not empty, then is tresspassing.
        if (result) return true;
        else return false;
    });
}

function sandTick() {
    // Decrement timeRemaining.
    timeRemaining -= 1;
    // Update the status panel.
    browser.runtime.sendMessage({"timeRemaining": timeRemaining});
    // Check if time is up, in which case redirect all tresspassers.
    if (timeRemaining <= 0) {
        browser.storage.sync.set({hourglass: 0})
            .catch(error => console.log(`Error: ${error}`));
        clearInterval(hourglass);
        timeRemaining = 0;
        blockAll();
    }
}

function blockAll() {
    getTresspassing(result => {
        for (let tab of result) {
            browser.tabs.update(
                tab.id,
                {url: browser.extension.getURL("block_page.html")});
        }
    }).catch(error => console.log(`Error: #{error}`));

}

function getTresspassing(process) {
    return browser.storage.sync.get("blacklist")
        .then(result => {
            var urls = [];
            for (let site of result.blacklist) {
                urls.push("*://*." + site + "/*");
                urls.push("*://" + site + "/*");
            }
            return browser.tabs.query({url: urls, active: true});
        })
        .then(process).catch(error => console.log(`Error: ${error}`));
}

// Create a timer if it doesn't exist. Once timer is established, add the gatekeeper.
browser.storage.sync.get("hourglass").then(result => {
    if (Object.keys(result).length == 0) {
        console.log("Creating new hourglass");
        browser.storage.sync.set({hourglass: timeAllowance})
            .catch(error => console.log(`Error: ${error}`));
        timeRemaining = timeAllowance;
    }
    else timeRemaining = result.hourglass;
}).then(result => {
console.log(timeRemaining);
    browser.tabs.onUpdated.addListener(gatekeeper);
    browser.tabs.onActivated.addListener(gatekeeper);
});
