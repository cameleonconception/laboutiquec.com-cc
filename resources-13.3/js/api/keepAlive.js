
    let activityTimer;
    const ACTIVITY_DEBOUNCE_DELAY_MS = 3000;

    function sendKeepAlive() {
        //fetch("/cc/api/keepAlive", {
        fetch("/laboutiquec.com/cc/api/keepAlive", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Erreur lors de l\'envoi du Keep-Alive:', error);
        });
    }

    function resetActivityTimer() {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(sendKeepAlive, ACTIVITY_DEBOUNCE_DELAY_MS);
    }

    document.addEventListener('DOMContentLoaded', resetActivityTimer);
    document.addEventListener('mousemove', resetActivityTimer);
    document.addEventListener('keypress', resetActivityTimer);
    document.addEventListener('scroll', resetActivityTimer);
    document.addEventListener('click', resetActivityTimer);
    document.addEventListener('touchstart', resetActivityTimer);






