let submitBtn = document.getElementById('submitBtn');
let form = document.getElementById('loginForm');

form.addEventListener('submit', function(event) {
    event.preventDefault();
});


submitBtn.addEventListener('click', function(event) {
    event.preventDefault();
    submitBtn.textContent = 'Validation en cours...';
    submitBtn.disabled = true;
    
    removeErrorMessage();

    let requiredFields = form.querySelectorAll('[required]');
    let requiredFieldsName = [];

    requiredFields.forEach(element => {
        requiredFieldsName.push(element.name);
    });

    const formData = new FormData(form);
    formData.append('requiredFieldsName', JSON.stringify(requiredFieldsName)); // AJOUTE CETTE LIGNE
    
    fetch("api/login", {
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
                    addElementAfterElementId('submitBtn', data.message);
                }

                if(data.tooManyAttempt) {
                    tooManyAttemptForm();
                }
            } else if (data && data.success === true) {
                if(localStorage.getItem('redirectPage')){
                    window.location.href = localStorage.getItem('redirectPage'); // dev
                    //window.location.href = localStorage.getItem('redirectPage'); // prod
                    localStorage.removeItem('redirectPage');
                }else{
                    window.location.href = './';
                }
            }
            submitBtn.textContent = 'Se connecter';
            submitBtn.disabled = false;
        })
        .catch(error => {
            addElementAfterElementId('submitBtn', 'Erreur lors de l\'envoi ou du traitement du formulaire. Erreur : ' + error.message);
            submitBtn.textContent = 'Se connecter';
            submitBtn.disabled = false;
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
    } else {
        addElementAfterElementId('submitBtn', `Aucun élément (input ou select) trouvé avec le nom "${elementName}". Le message "${message}" n'a pas pu être affiché.`);
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
        addElementAfterElementId('submitBtn', `Aucun élément n'a été trouvé avec le id "${elementId}". Le message "${message}" n'a pas pu être affiché.`);
    }
}

function tooManyAttemptForm(){
    form.innerHTML = `
        <h1>Accès refusé</h1>
        <p>Par mesure de sécurité, nous avons verrouillé votre compte. Pour y accéder, veuillez changer votre mot de passe.</p>
        <button type="button" onclick="window.location.href='nouveau-mot-de-passe'">Modifier mon mot de passe</button>
    `;
}





