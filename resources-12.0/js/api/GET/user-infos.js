document.addEventListener('DOMContentLoaded', function(){

    fetch("./api/GET/user-infos", {
            method: "POST",
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if(data.success){
                let infos = data.userInfos;

                Object.entries(infos).forEach(([key, value]) => {
                    if (value !== null && document.getElementById(key)) {

                
                        document.getElementById(key).value = value;

                        
                    }
                });
            }

        })
        .catch(error => {
            console.log(error.message);
        });

});









