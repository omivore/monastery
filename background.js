console.log("background.js loaded");

browser.runtime.onMessage.addListener(considerSite);

function considerSite(message) {
    console.log(message.url.origin);
}
