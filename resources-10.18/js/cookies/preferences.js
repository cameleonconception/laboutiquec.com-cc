let cookiePreferenceContainer = document.querySelector('#cookiePreferenceContainer');

if (!localStorage.getItem('cookiePreference') || (localStorage.getItem('cookiePreference') !== 'accepted' && localStorage.getItem('cookiePreference') !== 'refused')) {
    cookiePreferenceContainer.classList.remove('close');
} else if (localStorage.getItem('cookiePreference') === 'refused' || localStorage.getItem('cookiePreference') === 'accepted') {
    cookiePreferenceContainer.classList.add('close');
}

cookiePreferenceContainer.addEventListener('click', function() {
    cookiePreferenceContainer.classList.remove('close');
});

let acceptCookiePreferenceBtn = document.querySelector('#cookiePreferenceContainer button.accept');

acceptCookiePreferenceBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    cookiePreferenceContainer.classList.add('close');
    localStorage.setItem('cookiePreference', 'accepted');
});

let refuseCookiePreferenceBtn = document.querySelector('#cookiePreferenceContainer button.refuse');

refuseCookiePreferenceBtn.addEventListener('click', function(event) {
    event.stopPropagation();
    cookiePreferenceContainer.classList.add('close');
    localStorage.setItem('cookiePreference', 'refused');
});

let cookiePoliticsContainer = document.querySelector('#cookiePoliticsContainer');

cookiePoliticsCloseBtn.addEventListener('click', function(event){
    event.stopPropagation();
    cookiePoliticsContainer.style.display = 'none';
    cookiePreferenceContainer.style.display = 'flex';
});

function showCookiePolitics(){
    cookiePoliticsContainer.style.display = 'flex';
    cookiePreferenceContainer.style.display = 'none';
};






