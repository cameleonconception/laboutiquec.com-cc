let phone = document.querySelector('#phone');

phone.addEventListener('input', function() {
    let numbers = phone.value.replace(/\D/g, '');

    numbers = numbers.substring(0, 10);

    let formatted = numbers;
    if (numbers.length > 6) {
        formatted = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}-${numbers.substring(6,10)}`;
    } else if (numbers.length > 3) {
        formatted = `(${numbers.substring(0,3)}) ${numbers.substring(3,6)}`;
    } else if (numbers.length > 0) {
        formatted = `(${numbers}`;
    }

    phone.value = formatted;
});






