let sendTemporaryCode = document.getElementById('sendTemporaryCode');
let form = document.getElementById('newPasswordForm');

form.addEventListener('submit', function(event) {
    event.preventDefault();
});

sendTemporaryCode.addEventListener('click', function(event) {
    event.preventDefault();
    sendTemporaryCode.textContent = 'Validation en cours...';
    sendTemporaryCode.disabled = true;
    
    removeErrorMessage();

    let requiredFields = form.querySelectorAll('[required]');
    let requiredFieldsName = [];

    requiredFields.forEach(element => {
        requiredFieldsName.push(element.name);
    });


    const formData = new FormData(form);
    formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName));
    
    fetch("api/newPassword/sendTemporaryCode", {
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
                    addElementAfterElementId('sendTemporaryCode', data.message);
                }
            } else if (data && data.success === true) {
                validateTemporaryCodeForm(data.email);
            }

            sendTemporaryCode.textContent = 'Recevoir un code temporaire';
            sendTemporaryCode.disabled = false;
        })
        .catch(error => {
            addElementAfterElementId('sendTemporaryCode', 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
            sendTemporaryCode.textContent = 'Recevoir un code temporaire';
            sendTemporaryCode.disabled = false;
        });
});


function removeErrorMessage() {
    let spanErrors = document.querySelectorAll('span.error-message');
    spanErrors.forEach(span => {
        span.remove();
    });
}


function addElementAfterInput(elementName, message) {
    let targetElement = document.querySelector(`input[name="${elementName}"], select[name="${elementName}"]`);

    if (targetElement) {
        let span = document.createElement('span');
        span.textContent = message;
        span.classList.add('error-message');

        targetElement.after(span);
    }
}


function addElementAfterElementId(elementId, message) {
    let targetElement = document.querySelector(`#${elementId}`);

    if (targetElement) {
        let span = document.createElement('span');
        span.textContent = message;
        span.classList.add('error-message');

        targetElement.after(span);
    }
}

function validateTemporaryCodeForm(email){
    form.innerHTML = `
        <h1>Code temporaire</h1>
        <p>Si l'adresse courriel que vous avez saisie est associée à un compte, vous recevrez un code temporaire pour réinitialiser votre mot de passe.</p>
        <label for="temporaryCode">Code temporaire</label>
        <input id="temporaryCode" name="temporaryCode" type="text" maxlength="6" required>
        <input type="email" id="email" name="email" value="${email}" maxlength="255" autocomplete="off" required readonly hidden>
        <button id='validateTemporaryCodeBtn' type="button">Valider le code</button>
        <a href=''>Annuler</a>
    `;


    let requiredFields = form.querySelectorAll('[required]');
    let requiredFieldsName = [];

    requiredFields.forEach(element => {
        requiredFieldsName.push(element.name);
    });

    let validateTemporaryCodeBtn = document.getElementById('validateTemporaryCodeBtn');

    validateTemporaryCodeBtn.addEventListener('click', function(event) {
        event.preventDefault();
        validateTemporaryCodeBtn.textContent = 'Validation en cours...';
        validateTemporaryCodeBtn.disabled = true;

        removeErrorMessage();

        requiredFields.forEach(element => {
            requiredFieldsName.push(element.name);
        });

        const formData = new FormData(form);
        formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName));

        fetch("api/newPassword/validateTemporaryCode", {
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
                        addElementAfterElementId('validateTemporaryCodeBtn', data.message);
                    }

                    if(data.newTemporaryCode){
                        newTemporaryCodeForm(data.message);
                    }

                } else if (data && data.success === true) {
                    newPasswordForm(data.email, data.temporaryCode);
                }

                validateTemporaryCodeBtn.textContent = 'Valider le code';
                validateTemporaryCodeBtn.disabled = false;
            })
            .catch(error => {
                addElementAfterElementId('validateTemporaryCodeBtn', 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
                validateTemporaryCodeBtn.textContent = 'Valider le code';
                validateTemporaryCodeBtn.disabled = false;
            });
    });
}

function newTemporaryCodeForm(message){
    form.innerHTML = `
        <h1>Code temporaire</h1>
        <p>${message}</p>
        <button type="button" onclick="window.location.href=''">Demander un nouveau code temporaire</button>
        <a href=''>Annuler</a>
    `;
}



function newPasswordForm(email, temporaryCode){
    form.innerHTML = `
        <h1>Nouveau mot de passe</h1>
        <p>Veuillez saisir votre nouveau mot de passe</p>
        <label for="password">Nouveau mot de passe</label>
        <input id="password" name="password" type="password" maxlength="255"  autocomplete="off" required>
        <label for="confirmedPassword">Confirmer le nouveau mot de passe</label>
        <input id="confirmedPassword" name="confirmedPassword" type="password" maxlength="255"  autocomplete="off" required>
        <input id="temporaryCode" name="temporaryCode" type="text" value="${temporaryCode}" maxlength="6" required readonly hidden>
        <input type="email" id="email" name="email" value="${email}" maxlenth="255" autocomplete="off" required readonly hidden>
        <button id='updatePasswordBtn' type="button">Mettre à jour</button>
        <a href=''>Annuler</a>
    `;

    let updatePasswordBtn = document.getElementById('updatePasswordBtn');

    updatePasswordBtn.addEventListener('click', function(event) {
    
    event.preventDefault();
    updatePasswordBtn.textContent = 'Validation en cours...';
    updatePasswordBtn.disabled = true;
    
    removeErrorMessage();

    let requiredFields = form.querySelectorAll('[required]');
    let requiredFieldsName = [];

    requiredFields.forEach(element => {
        requiredFieldsName.push(element.name);
    });


    const formData = new FormData(form);
    formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName));
    
    fetch("api/newPassword/updatePassword", {
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
                    addElementAfterElementId('updatePasswordBtn', data.message);
                }

                if(data.newTemporaryCode){
                    newTemporaryCodeForm(data.message);
                }

            } else if (data && data.success === true) {
                form.innerHTML = `
                    <h1>Mot de passe mis à jour</h1>
                    <p>Votre mot de passe a été mis à jour avec succès !</p>
                `;
            }

            updatePasswordBtn.textContent = 'Mettre à jour';
            updatePasswordBtn.disabled = false;
        })
        .catch(error => {
            addElementAfterElementId('updatePasswordBtn', 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
            updatePasswordBtn.textContent = 'Mettre à jour';
            updatePasswordBtn.disabled = false;
        });
    })


}






