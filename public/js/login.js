sessionStorage.clear();

let loginForm = document.querySelector('form');
loginForm.onsubmit = () => {
    let checkCorrect = true;

    if (!checkEmail()) {
        checkCorrect = false;
    }
    
    if (!checkPassword()) {
        checkCorrect = false;
    }    
    
    if (checkCorrect) {
        return true;
    } else {
        return false;
    }
}


let email = document.querySelector('#email');

email.onchange = checkEmail;
email.onkeydown = () => {
    let emailWarning = document.querySelector('#email-warning');
    if (email.value.length > 0) {
        emailWarning.style.visibility = 'hidden';
    }
}

function checkEmail() {
    let emailWarning = document.querySelector('#email-warning');

    if (email.value.length > 0) {
        emailWarning.style.visibility = 'hidden';
        return true;
    } else {
        emailWarning.style.visibility = 'visible';
        emailWarning.innerHTML = '* Email không được trống';
        return false;
    }
}


let password = document.querySelector('#password');

password.onchange = checkPassword;
password.onkeydown = () => {
    let passwordWarning = document.querySelector('#password-warning');
    if (password.value.length > 0) {
        passwordWarning.style.visibility = 'hidden';
    }
}

function checkPassword() {
    let passwordWarning = document.querySelector('#password-warning');
    if (password.value.length == 0) {
        passwordWarning.style.visibility = 'visible';
        passwordWarning.innerHTML = '* Mật khẩu không được trống';
        return false;
    } else {
        passwordWarning.style.visibility = 'hidden';
        return true;
    }
}
