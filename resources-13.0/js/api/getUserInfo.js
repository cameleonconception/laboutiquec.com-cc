document.addEventListener('DOMContentLoaded', function(){

    fetch("api/getUserInfo", {
            method: "POST",
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.log(error.message);
        });

});







