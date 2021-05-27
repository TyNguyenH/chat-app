import CONFIG from './config.js';




let changePasswordWrapper = document.querySelector('#change-password-wrapper');
let oldPasswordElement = document.querySelector('#old-password');
let newPasswordElement = document.querySelector('#new-password');

function checkOldPassword() {
    const passwordVal = oldPasswordElement.value;
    let oldPasswordWarning = document.querySelector('#old-password-warning');

    if (passwordVal.length >= 6) {
        oldPasswordWarning.classList.add('invisible');
        return true;
    } else {
        if (oldPasswordWarning.classList.contains('invisible')) {
            oldPasswordWarning.classList.remove('invisible');
        }
        return false;
    }
}

function checkNewPassword() {
    const passwordVal = newPasswordElement.value;

    let minLetters = false;
    let capLetter = false;
    let normalLetter = false;
    let numericLetter = false;

    if (passwordVal.length >= 6) {
        minLetters = true;
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

    if (minLetters && capLetter && normalLetter && numericLetter) {
        return true;
    } else {
        return false;
    }
}

oldPasswordElement.onchange = checkOldPassword;
newPasswordElement.onkeyup = checkNewPassword;




// Successful notification when updating password
const successfulNotification = document.createElement('div');
successfulNotification.setAttribute('id', 'successful-notification');
successfulNotification.setAttribute('class', 'container border border-gray-300 mt-28 mx-auto w-80 rounded-lg shadow-xl');
successfulNotification.innerHTML = `
    <div class="bg-blue-500 py-4 rounded-lg rounded-b-none">
        <img src="/imgs/white-tick.png" class="mx-auto w-32">
    </div>
    <p class="py-4 mx-14 text-xl font-bold text-center">Bạn vui lòng kiểm tra email để xác nhận cập nhật mật khẩu !</p>
    <div class="container mx-auto w-1/2 text-center ">
        <button class="
            mb-3 px-2 py-1
            cursor-pointer
            bg-black rounded-md shadow-md
            text-white font-semibold
            focus:outline-none
            hover:shadow-lg
            transform hover:scale-105
            transition duration-75
            ">
            Đóng
        </button>
    </div>
`;
successfulNotification.onclick = (event) => {
    const currentTarget = event.currentTarget;
    currentTarget.remove();

    document.body.appendChild(changePasswordWrapper);
    resetBtn.click();
}


// Successful notification when updating password
const unsuccessfulNotification = document.createElement('div');
unsuccessfulNotification.setAttribute('id', 'unsuccessful-notification');
unsuccessfulNotification.setAttribute('class', 'container border border-gray-300 mt-28 mx-auto w-80 rounded-lg shadow-xl');
unsuccessfulNotification.innerHTML = `
    <div class="bg-gray-200 py-8 rounded-lg rounded-b-none">
        <img src="/imgs/x-mark.png" class="mx-auto w-24">
    </div>
    <p class="py-4 mx-10 text-xl font-bold text-center">Thay đổi mật khẩu không thành công !</p>
    <div class="container mx-auto w-1/2 text-center ">
        <button class="
            mb-3 px-2 py-1
            cursor-pointer
            bg-black rounded-md shadow-md
            text-white font-semibold
            focus:outline-none
            hover:shadow-lg
            transform hover:scale-105
            transition duration-75
            ">
            Đóng
        </button>
    </div>
`;
unsuccessfulNotification.onclick = (event) => {
    const currentTarget = event.currentTarget;
    currentTarget.remove();

    document.body.appendChild(changePasswordWrapper);
};



// Reset button for entered data
let resetBtn = document.querySelector('#reset-btn');
resetBtn.onclick = () => {
    oldPasswordElement.value = '';
    let oldPasswordWarning = document.querySelector('#old-password-warning');
    if (!oldPasswordWarning.classList.contains('invisible')) {
        oldPasswordWarning.classList.add('invisible');
    }

    newPasswordElement.value = '';
    checkNewPassword();
}

// Update button
let updateBtn = document.querySelector('#update-btn');
updateBtn.onclick = () => {
    let oldPasswordVal = oldPasswordElement.value.trim();
    let newPasswordVal = newPasswordElement.value.trim();

    if (checkOldPassword() && checkNewPassword()) {
        const option = {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                oldPassword: oldPasswordVal,
                newPassword: newPasswordVal
            })
        }

        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/user-account`, option)
            .then(res => res.json())
            .then(data => {
                if (data.message == 'success') {
                    changePasswordWrapper.remove();
                    document.body.appendChild(successfulNotification);
                } else {
                    changePasswordWrapper.remove();
                    document.body.appendChild(unsuccessfulNotification);
                }
            });
    }
}