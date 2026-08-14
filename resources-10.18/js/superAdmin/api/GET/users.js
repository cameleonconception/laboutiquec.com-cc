
    
    function loadAndRenderUsers() {
            let usersContainer = document.getElementById('dash-usersContainer');


        fetch('./api/superAdmin/GET/users',{
        method: "POST",

        })
            .then(response => response.json())
            .then(data => {

                if(data.success) {
                    let users = data.users;
                    let usersCount = users.length;
                    if(usersCount === 0){
                       usersContainer.innerHTML = `
                        <h1>Utilisateurs</h1>
                        <p>Aucun utilisateur encore enregistré sur la boutique</p>
                        `;
                    }else if(usersCount > 0){
                        usersContainer.innerHTML = `
                        <h1>Utilisateurs</h1>
                        <p>Total : ${usersCount}</p>
                        <div id="" class="table-scroll-wrapper">
                            <table id="" class="product-summary-table">
                                <thead>
                                    <tr>
                                        <th>Id</th>
                                        <th>Prénom</th>
                                        <th>Nom</th>
                                         <th>Adresse courriel</th>
                                        <th>Téléphone</th>
                                        <th>Adresse</th>
                                        <th>Ville</th>
                                        <th>Province</th>
                                        <th>Pays</th>
                                        <th>Code postal</th>
                                        <th>Rôle</th>
                                    </tr>
                                </thead>
                                <tbody id="dash-users-table-body">
                                </tbody>
                            </table>
                        </div>
                        `;

                        let container = document.querySelector('#dash-users-table-body');

                        
                        users.forEach(user => {

                            if(user.role == 2){
                                user.role = "superAdmin";
                            }else if(user.role == 1){
                                user.role = "admin";
                            }else{
                                user.role == "";
                            }

                            container.innerHTML += `<tr>
                            <td>${user.id ?? ''}</td>
                            <td>${user.fname ?? ''}</td>
                            <td>${user.lname ?? ''}</td>
                            <td>${user.email ?? ''}</td>
                            <td>${user.phone ?? ''}</td>
                            <td>${user.address ?? ''}</td>
                            <td>${user.city ?? ''}</td>
                            <td>${user.province ?? ''}</td>
                            <td>${user.country ?? ''}</td>
                            <td>${user.postalCode ?? ''}</td>
                            <td>${user.role ?? ''}</td>
                            </tr>`;
                        });
                        
                    }
                }
            })
            .catch(error => console.error('Error fetching products:', error));
    }

    // Fonction utilitaire pour le formatage de la date 
    function formatDateToLocal(utcDateString) {
        if (!utcDateString) return 'Date inconnue';
        
        const dateObject = new Date(utcDateString.replace(' ', 'T') + 'Z');

        if (isNaN(dateObject)) {
            return utcDateString;
        }

        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        };
        
        return dateObject.toLocaleDateString(navigator.language, options);
    }







