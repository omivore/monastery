// delay_page.js

var delay = null;
var delayLength = null;
var destination = null;

function release() {
    // Once delay is done, add this tab to the passedDelay list
    browser.tabs.update(
        {url: destination}
    ).then(tab => {
        browser.runtime.sendMessage({'newPassedDelay': tab.id});
    });
}

function restartDelay() {
    console.log("Beginning delay timer");
    delay = setTimeout(release, delayLength * 1000);
}

function initialize(delayTime, destinationURL) {
    if (delay == null) restartDelay();
    if (delayLength == null) delayLength = delayTime;
    if (destination == null) destination = destinationURL;
}

document.onfocus = restartDelay;

document.onblur = () => {
    console.log("Resetting delay");
    clearTimeout(delay);
};
