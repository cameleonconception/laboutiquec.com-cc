document.addEventListener('DOMContentLoaded', function(){

    fetch("./api/GET/user-info-for-payment", {
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
                        
                        /*if(key === 'address'){
                            document.getElementById(key).value = 'Cégep Ahuntsic, 9155 Rue St-Hubert';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'city'){
                            document.getElementById(key).value = 'Montréal';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'province'){
                            document.getElementById(key).value = 'Québec';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                             document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'country'){
                            document.getElementById(key).value = 'Canada';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                             document.querySelector(`label[for="${key}"]`).className = '';
                        }else if(key === 'postalCode'){
                            document.getElementById(key).value = 'H2M1Y8';
                            document.getElementById(key).setAttribute('readonly', true);
                            document.getElementById(key).className = '';
                            document.querySelector(`label[for="${key}"]`).className = '';
                        }else{
                            document.getElementById(key).value = value;
                        }
                        */
                        
                        
                    }
                });
            }

        })
        .catch(error => {
            console.log(error.message);
        });

});







