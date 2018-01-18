// background.js

var hourglass = null;
var delayed = [];

// Initialize all storage variables if nonexistent
browser.storage.local.get(['blockgroups', 'whitelist']).then(vars => {
    if (!vars.hasOwnProperty('blockgroups')) {
        var temp = Blockgroup([], 60, [], false, 30, false);
        browser.storage.local.set({blockgroups: {[temp.id]: temp}});
        console.log("Initialized empty storage variable blockgroups");
    }
    if (!vars.hasOwnProperty('whitelist')) {
        browser.storage.local.set({whitelist: [
            browser.extension.getURL('pages/block_page.html'),
            browser.extension.getURL('pages/delay_page.html')
        ]});
        console.log("Initialized empty storage variable whitelist");
    }
});

function startHourglass(blockgroup) {
    console.log("Starting hourglass for blockgroup " + blockgroup.id);
    window.clearInterval(hourglass);
    hourglass = window.setInterval(() => {
        tick(blockgroup);
    }, 1000);

    blockgroup.hourglass.isActive = true;
};
function stopHourglass(blockgroup) {
    console.log("Stopping current hourglass");
    window.clearInterval(hourglass);
    blockgroup.hourglass.isActive = false;
}

// Processing functions
/**
 * matchActive return list of Tab objects that fit in urls but not in ignore
 * urls is a list of string URL match patterns
 * ignore is an optional list of string URL match patterns too
 */
function matchActive(urls, ignore = []) {
    return Promise.all([
        browser.tabs.query({url: matchers(urls), active: true}),
        browser.tabs.query({url: matchers(ignore), active: true})
    ]).then((blacks) => {
        return blacks[0].filter(tab => !blacks[1].includes(tab));
    });
}

/**
 * Returns all the urls in format for Firefox's URL matcher
 */
function matchers(urls) {
    var matchers = [];
    for (let site of urls) {
        matchers.push('*://*.' + site + '/*');
        matchers.push('*://' + site + '/*');
    }
    return matchers;
};

function tick(blockgroup) {
    blockgroup.hourglass.timeLeft -= 1;
    console.log(blockgroup);
    updateBlockgroup(blockgroup);
}

function blockTab(tab) {
    browser.tabs.update(
        tab.id,
        {url: browser.extension.getURL('pages/block.html')}
    );
}

function delayTab(tab) {

}

function setIcon(state) {
    switch (state) {
        case setIcon.State.blocking:
            browser.browserAction.setIcon({
                path: { 48: 'icons/lock.svg' },
            });
            break;
        case setIcon.State.delay:
            browser.browserAction.setIcon({
                path: { 48: 'icons/delay.svg' },
            });
            break;
        default:
        case setIcon.State.neutral:
            browser.browserAction.setIcon({
                path: { 48: 'icons/monastery.svg' },
            });
            break;
    }
}
setIcon.State = {
    blocking: "blocking",
    delay: "delay",
    neutral: "neutral",
};


// Set up tab watching
function gatekeeper(event) {
    browser.storage.local.get(['blockgroups', 'whitelist']).then(vars => {
        for (let key in vars.blockgroups) {
            var blockgroup = vars.blockgroups[key];
            console.log(blockgroup);
            matchActive(blockgroup.blacklist, vars.whitelist).then(blacks => {
                console.log(blacks);
                if (blacks.length > 0) {
                    // The current page tresspasses this blockgroup
                    let active = blacks[0];
                    if (blockgroup.delay.isDelayActive) {
                        if (delayed.includes(active.id)) {
                            setIcon(setIcon.State.blocking);
                            startHourglass(blockgroup);
                        } else {
                            setIcon(setIcon.State.delay);
                            delayTab(active);
                        }
                    } else {
                        if (blockgroup.hourglass.timeLeft > 0) {
                            setIcon(setIcon.State.blocking);
                            startHourglass(blockgroup);
                        } else blockTab(active);
                    }
                    return;
                } else {
                    // The current page is innocent of *this* blockgroup
                    setIcon(setIcon.State.neutral);
                    stopHourglass(blockgroup);
                }
            });
        }
    }, error => console.log(error));
}

browser.tabs.onUpdated.addListener(gatekeeper);
browser.tabs.onActivated.addListener(gatekeeper);

// Tests
// TODO: remove tests

/* Test matchActive
browser.tabs.onUpdated.addListener((event) => {
    console.log("updated");
    matchActive(new MatchList(["reddit.com", "facebook.com"])).then(results => {
        console.log(results);
    });
});
browser.tabs.onActivated.addListener((event) => {
    console.log("activated");
    matchActive(new MatchList(["reddit.com", "facebook.com"])).then(results => {
        console.log(results);
    });
});*/

// Test blockgroups
//console.log("test");
let testBlock = Blockgroup(["reddit.com", "facebook.com"], 1, [5, 10], true, 10, true);
//console.log(testBlock);
//console.log("thing ");
//console.log(thing);
testBlock.name = "Testme";
browser.storage.local.set({blockgroups: {
    [testBlock.id]: testBlock
}});
browser.storage.local.get('blockgroups').then(r => {
    console.log(r.blockgroups);
});
// Wait a bit then set it again bc the intialization blocks run afterwards and
// clear the blockgroups thing
setTimeout(() => {
    browser.storage.local.set({blockgroups: {
        [testBlock.id]: testBlock
    }});
}, 5000);

// Test whitelists
browser.storage.local.set({
    whitelist: ['facebook.com/messages']
});

setTimeout(() => {
    browser.storage.local.get('whitelist').then(r => {
        console.log(r.whitelist);
    });
}, 5000);
