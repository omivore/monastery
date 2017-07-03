// options.js

/// Disable select options if time is up for today
function approveEdit() {
    return browser.storage.sync.get('hourglass')
        .then(result => {
            if (result.hourglass == 0) {
                document.querySelector('#disabledNotice').classList.remove('hidden');
                return false;
            } else return true;
        });
}
