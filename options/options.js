// options.js

/// Disable select options if time is up for today
function approveEdit() {
    return browser.storage.sync.get(['hourglass', 'timeout'])
        .then(result => {
            // Exception: If timeout is 0, then let them change whatever
            if (result.timeout == 0) {
                return true;
            }

            if (result.hourglass == 0) {
                document.querySelector('#disabledNotice').classList.add('shown');
                // Add hidden back in after css animation plays
                setTimeout(() => {
                    document.querySelector('#disabledNotice').classList.remove('shown');
                }, 5000);
                return false;
            } else return true;
        });
}
