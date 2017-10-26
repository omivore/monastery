// delay_page.js

var delay = null;
var delayCounter = null;

var initialized = false;
var delayLength = null;
var destination = null;

let delayLeft = document.querySelector('#delayLeft');

function release() {
    // Once delay is done, add this tab to the passedDelay list
    browser.tabs.update(
        {url: destination}
    ).then(tab => {
        browser.runtime.sendMessage({'newPassedDelay': tab.id});
    });
}

function restartDelay() {
    if (!initialized) {
        console.log("Deferring until initialization");
        return;
    }

    console.log("Beginning delay timer");
    if (delay == null) {
        delay = setTimeout(release, delayLength * 1000);
    }

    delayLeft.textContent = delayLength;
    if (delayCounter == null) {
        delayCounter = setInterval(() => {
            delayLeft.textContent = delayLeft.textContent - 1;
        }, 1000);
    }
}

function initialize(delayTime, destinationURL) {
    console.log("Initializing delays");
    if (delayLength == null) delayLength = delayTime;
    if (destination == null) destination = destinationURL;
    if (delay == null) restartDelay();
    initialized = true;
}

document.onfocus = restartDelay;

document.onblur = () => {
    console.log("Resetting delay");

    clearTimeout(delay);
    clearInterval(delayCounter);

    delay = null;
    delayCounter = null;

    delayLeft.textContent = delayLength;
};
