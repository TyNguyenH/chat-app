import CONFIG from './config.js';


let registerForm = document.querySelector('form');
registerForm.onsubmit = () => {
    let checkCorrect = true;

    const checkFirstName = checkFullName('first name');
    const checkLastName = checkFullName('last name');
    if (!checkFirstName || !checkLastName) {
        checkCorrect = false;
    }

    if (!checkEmail()) {
        checkCorrect = false;
    }

    const emailWarning = document.querySelector('#email-warning');
    if (!checkPassword() || emailWarning.textContent == '* Tài khoản đã tồn tại') {
        checkCorrect = false;
    }

    if (!avatarIsImage()) {
        checkCorrect = false;
        let avatarWarning = document.querySelector('#avatar-warning');
        avatarWarning.style.visibility = 'visible';
        avatarWarning.innerHTML = '* Ảnh đại diện không được trống';
    }

    if (checkCorrect) {
        return true;
    } else {
        return false;
    }
}



let firstName = document.querySelector('#first-name');
let lastName = document.querySelector('#last-name');

firstName.onchange = () => {
    checkFullName('first name');
};

lastName.onchange = () => {
    checkFullName('last name');
};

function checkFullName(option) {
    let fullnamePattern =
        /^([(a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựýỳỵỷỹ)\s]{1,20})$/g;

    if (option == 'first name') {
        let firstNameWarning = document.querySelector('#first-name-warning');
        if (firstName.value.match(fullnamePattern)) {
            firstNameWarning.style.visibility = 'hidden';
            return true;
        }
        
        if (!firstName.value.match(fullnamePattern) || firstName.value.length == 0 ) {
            firstNameWarning.style.visibility = 'visible';
            firstNameWarning.innerHTML = '* Tên không hợp lệ';
            return false;
        }
    }

    if (option == 'last name') {
        let lastNameWarning = document.querySelector('#last-name-warning');
        if (lastName.value.match(fullnamePattern)) {
            lastNameWarning.style.visibility = 'hidden';
            return true;
        }

        if (!lastName.value.match(fullnamePattern) || lastName.value.length == 0) {
            lastNameWarning.style.visibility = 'visible';
            lastNameWarning.innerHTML = '* Họ không hợp lệ';
            return false;
        }
    }
}



let email = document.querySelector('#email');
email.onchange = checkEmail;
function checkEmail() {
    let emailPattern = /^\b[\w\.-]+@[\w\.-]+\.\w{1,}\b$/g;
    let emailWarning = document.querySelector('#email-warning');

    if (email.value.match(emailPattern)) {
        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/register/email?email=${email.value}`)
        .then(response => {
            response.json()
            .then(data => {
                // Account is already existed
                if (data.status == 'existed') {
                    emailWarning.style.visibility = 'visible';
                    emailWarning.innerHTML = '* Tài khoản đã tồn tại';
                } 
                
                // Account is new
                else if (data.status == 'OK') {
                    emailWarning.innerHTML = 'OK';
                    emailWarning.style.visibility = 'hidden';
                }

                // Message sent from server if error found
                else if (data.msg) {
                    console.log(data.msg);
                    return false;
                }
            })
        });

        return true;
    }

    else if (email.value.length == 0) {
        emailWarning.style.visibility = 'visible';
        emailWarning.innerHTML = '* Email không được trống';
        return false;
    }
    
    else {
        emailWarning.style.visibility = 'visible';
        emailWarning.innerHTML = '* Email không hợp lệ';
        return false;
    }
}



let password = document.querySelector('#password');
let showPasswordText = document.querySelector('#show-password');

showPasswordText.onclick = () => {
    if (password.type === 'password') {
        password.type = 'text';
    } else {
        password.type = 'password';
    }
}
password.onkeyup = checkPassword;

function checkPassword() {
    let passwordVal = password.value;

    let minLetters = false;
    let maxLetters = false;
    let capLetter = false;
    let normalLetter = false;
    let numericLetter = false;

    if (passwordVal.length >= 6) {
        minLetters = true;
    }

    if (passwordVal.length <= 16) {
        maxLetters = true;
    }

    if (passwordVal.match(/[A-Z]/g)) {
        capLetter = true;
    }

    if (passwordVal.match(/[a-z]/g)) {
        normalLetter = true;
    }

    if (passwordVal.match(/[0-9]/g)) {
        numericLetter = true;
    }

    let minLettersWarn = document.querySelector('#pass-req-min-letter');
    if (minLetters) {
        minLettersWarn.classList.add('text-blue-500');
    } else {
        minLettersWarn.classList.remove('text-blue-500');
    }

    let maxLettersWarn = document.querySelector('#pass-req-max-letter');
    if (maxLetters) {
        maxLettersWarn.classList.add('text-blue-500');
    } else {
        maxLettersWarn.classList.remove('text-blue-500');
    }

    let capLettersWarn = document.querySelector('#pass-req-cap-letter');
    if (capLetter) {
        capLettersWarn.classList.add('text-blue-500');
    } else {
        capLettersWarn.classList.remove('text-blue-500');
    }

    let normalLettersWarn = document.querySelector('#pass-req-norm-letter');
    if (normalLetter) {
        normalLettersWarn.classList.add('text-blue-500');
    } else {
        normalLettersWarn.classList.remove('text-blue-500');
    }

    let numericLettersWarn = document.querySelector('#pass-req-num-letter');
    if (numericLetter) {
        numericLettersWarn.classList.add('text-blue-500');
    } else {
        numericLettersWarn.classList.remove('text-blue-500');
    }

    if (minLetters && maxLetters && capLetter && normalLetter && numericLetter) {
        return true;
    } else {
        return false;
    }
}



let avatarInput = document.querySelector('#avatar');

// Check if avatar is image
function avatarIsImage() {
    let avatarImg = document.querySelector('#avatar');
    if (avatarImg.files[0]) {
        let fileType = avatarImg.files[0].type;
        if (fileType.includes('image')) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// Preview image before uploading
avatarInput.onchange = (fileEvent) => {
    let fileReader = new FileReader();

    fileReader.onload = (event) => {
        let img = document.querySelector('#avatar-preview-img');
        img.setAttribute('src', event.target.result);
        img.style.visibility = 'visible';
    }

    let avatarWarning = document.querySelector('#avatar-warning');
    if (avatarIsImage()) {
        avatarWarning.style.visibility = 'hidden';
        fileReader.readAsDataURL(fileEvent.target.files[0]);
    } else {    
        avatarWarning.style.visibility = 'visible';
        avatarWarning.innerHTML = '* Ảnh đại diện không hợp lệ';
    }
}