let birthday = document.querySelector('#birthday');

birthday.addEventListener('input', function() {
    let numbers = birthday.value.replace(/\D/g, '').substring(0, 8);

    let formatted = numbers;
    if (numbers.length > 6) {
        formatted = `${numbers.substring(0,4)}-${numbers.substring(4,6)}-${numbers.substring(6,8)}`;
    } else if (numbers.length > 4) {
        formatted = `${numbers.substring(0,4)}-${numbers.substring(4,6)}`;
    } else {
        formatted = numbers.substring(0,4);
    }

    birthday.value = formatted;
});






