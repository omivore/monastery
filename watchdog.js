console.log(window.location);

window.addEventListener("click", notifyExtension);

function notifyExtension(e) {
    browser.runtime.sendMessage({"url": window.location});
}
