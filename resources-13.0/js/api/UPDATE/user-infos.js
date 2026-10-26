

function updateUserInfos() {

            let updateProfileBtn = document.querySelector("#updateProfileBtn");
                    
            updateProfileBtn.innerText = "Validation en cours.."; 

            let form = document.getElementById('userInfosForm');
            let requiredFields = form.querySelectorAll('[required]');
            let requiredFieldsName = [];

            requiredFields.forEach(element => {
                requiredFieldsName.push(element.name);
            });

            const formData = new FormData(form);
            formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName));
            
            fetch("./api/UPDATE/user-infos", {
                method: "POST",
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.success === false) {
                    if (data.errors && typeof data.errors === 'object') {
                        for (const fieldName in data.errors) {
                            if (data.errors.hasOwnProperty(fieldName)) {
                                const errorMessage = data.errors[fieldName];
                                addElementAfterInput(fieldName, errorMessage); 
                            }
                        }
                    }

                    if(data.message){
                        addElementAfterElementId('updateProfileBtn', data.message); 
                    }
                    
                    updateProfileBtn.innerText = "Mettre à jour"; 
                } else if (data && data.success === true) {
            removeErrorMessage();

                updateProfileBtn.innerText = "✔"; 

                updateProfileBtn.style.backgroundColor = "var(--accent-color)";
                updateProfileBtn.style.color = "white"; 
                
                updateProfileBtn.disabled = true;

                setTimeout(() => {
                    
                    updateProfileBtn.innerText = "Mettre à jour"; 
                    updateProfileBtn.style.backgroundColor = "var(--primary-color)";
                    updateProfileBtn.style.color = "white";
                    
                    updateProfileBtn.disabled = false;

                }, 1000);


        }
    }) // <--- CORRECTION APPLIQUÉE ICI : Fermeture correcte du bloc .then(data => {})
    .catch(error => {
        console.error('Erreur réseau ou API:', error);
        addElementAfterElementId('updateProfileBtn', 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
    });
}

                function removeErrorMessage() {
                let spanErrors = document.querySelectorAll('span.error-message');
                spanErrors.forEach(span => {
                    span.remove();
                });
            }

            function addElementAfterInput(elementName, message) {
                let targetElement = document.querySelector(`input[name="${elementName}"], select[name="${elementName}"],textarea[name="${elementName}"]`);
                if (targetElement) {
                    let span = document.createElement('span');
                    span.textContent = message;
                    span.classList.add('error-message');
                    targetElement.after(span);
                } else {
                    addElementAfterElementId('updateProfileBtn', `Aucun élément (input ou select) trouvé avec le nom "${elementName}". Le message "${message}" n'a pas pu être affiché.`);
                }
            }

            function addElementAfterElementId(elementId, message) {
                let targetElement = document.querySelector(`#${elementId}`);
                if (targetElement) {
                    let span = document.createElement('span');
                    span.textContent = message;
                    span.classList.add('error-message');
                    targetElement.after(span);
                } else {
                    console.error(`Erreur: Aucun élément n'a été trouvé avec l'id "${elementId}". Le message "${message}" n'a pas pu être affiché.`);
                }
            }


            






