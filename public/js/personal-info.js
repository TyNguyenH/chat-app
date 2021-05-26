import CONFIG from './config.js';


sessionStorage.clear();

fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/personal-info`)
    .then(response => response.json())
    .then(data => {
        let userAvatarSrc = document.querySelector('#avatar');
        if (userAvatarSrc) {
            userAvatarSrc.setAttribute('src', data.avatarSrc);
        }

        let userID = document.querySelector('#user-id');
        if (userID) {
            userID.textContent = data.userID;
        }
        
        let lastNameInfo = document.querySelector('#last-name');
        if (lastNameInfo) {
            lastNameInfo.textContent = data.lastName;
        }
        
        let firstNameInfo = document.querySelector('#first-name');
        if (firstNameInfo) {
            firstNameInfo.textContent = data.firstName;
        }

        let emailInfo = document.querySelector('#email');
        if (emailInfo) {
            emailInfo.textContent = data.email;
        }

        let joinDate = document.querySelector('#join-date');
        if (joinDate) {
            joinDate.textContent = data.dateJoined;
        }

        let activeStatus = document.querySelector('#active-status');

        if (activeStatus && data.isActive == true) {
            activeStatus.textContent = 'Đang hoạt động';
            if (document.querySelector('#active-status-btns')) {
                let funcionButtons = document.querySelector('#active-status-btns');
                funcionButtons.innerHTML += `
                    <button
                        id="deactivate-account-btn"
                        class="
                            mx-1 px-2 py-1 rounded-lg bg-red-600 shadow-lg
                            font-semibold text-white text-center
                            focus:outline-none
                            transform hover:scale-105
                            transition duration-75
                        ">
                        Hủy kích hoạt
                    </button>
                `;

                let deactivateAccountBtn = document.querySelector('#deactivate-account-btn');
                deactivateAccountBtn.onclick = () => {
                    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/deactivate-user`, { method: 'PUT' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.msg == 'success') {
                                location.reload();
                            }
                        })
                }
            }
        }

        if (activeStatus && data.isActive == false) {
            activeStatus.textContent = 'Không hoạt động';
            if (document.querySelector('#active-status-btns')) {
                let funcionButtons = document.querySelector('#active-status-btns');
                funcionButtons.innerHTML += `
                    <button
                        id="activate-account-btn"
                        class="
                            mx-1 px-2 py-1 rounded-lg bg-blue-500 shadow-lg
                            font-semibold text-white text-center
                            focus:outline-none
                            transform hover:scale-105
                            transition duration-75
                        ">
                        Kích hoạt
                    </button>
                `;

                let activateAccountBtn = document.querySelector('#activate-account-btn');
                activateAccountBtn.onclick = () => {
                    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/activate-user`, { method: 'PUT' })
                        .then(response => response.json())
                        .then(data => {
                            if (data.msg == 'success') {
                                location.reload();
                            }
                        })
                }
            }
        }  
    });






// Change password button
let changePasswordBtn = document.querySelector('#change-password-btn');
changePasswordBtn.onclick = () => {
    let fullInfoWrapper = document.querySelector('#full-info-wrapper');
    if (fullInfoWrapper) {
        fullInfoWrapper.remove();
        
        // Create old password element
        let oldPasswordElement = document.createElement('div');
        {
            const showOldPassword = `
                let password = document.querySelector('#old-password');
                if (password.type === 'password') {
                    password.type = 'text';
                } else {
                    password.type = 'password';
                }
            `;

            oldPasswordElement.innerHTML = `
                <div class="flex flex-row items-center">
                    <label for="old-password" class="w-1/3 text-lg font-semibold">Mật khẩu cũ:</label>
                    <input id="old-password" type="password" 
                        class="
                            focus:outline-none w-2/3 px-3 py-1
                            focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:bg-gray-100
                            rounded-lg shadow-lg bg-gray-200 break-words
                            transition duration-150">
                </div>
                <div class="flex flex-row justify-end mx-1 mb-9">
                    <div id="old-password-warning" class="mt-6 w-5/12 text-red-500 invisible">* Tối thiểu 6 ký tự</div>
                    <div class="mt-2 mb-4 flex self-start justify-end items-center">
                        <label class="mx-1 text-sm text-center">Hiện mật khẩu</label>
                        <input id="show-old-password" type="checkbox" class="h-4 w-4" onclick="${showOldPassword}">
                    </div>
                </div>
            `;
        }

        // Create new password element
        let newPasswordElement = document.createElement('div');
        {
            const showNewPassword = `
                let password = document.querySelector('#new-password');
                if (password.type === 'password') {
                    password.type = 'text';
                } else {
                    password.type = 'password';
                }
            `;

            newPasswordElement.innerHTML = `
                <div class="flex flex-row items-center">
                    <div class="w-1/3 text-lg font-semibold">Mật khẩu mới:</div>
                    <input id="new-password" type="password" 
                        class="
                            focus:outline-none w-2/3 px-3 py-1
                            focus:ring-2 focus:ring-purple-600 focus:border-transparent focus:bg-gray-100
                            rounded-lg shadow-lg bg-gray-200 break-words
                            transition duration-150">
                </div>
                <div class="flex flex-row justify-end mx-1 mb-8">
                    <div class="w-4/12 mt-6">
                        <ul id="password-requirements" class="ml-1 text-red-500 visible text-base">
                            <li class="text-black">Yêu cầu mật khẩu:</li>
                            <li id="pass-req-min-letter">Tối thiểu 6 ký tự</li>
                            <li id="pass-req-cap-letter">Có chữ in hoa</li>
                            <li id="pass-req-norm-letter">Có chữ thường</li>
                            <li id="pass-req-num-letter">Có chữ số</li>
                        </ul>
                    </div>
                    <div class="w-4/12 flex mt-2 self-start justify-end items-center">
                        <label class="mx-1 text-sm text-center">Hiện mật khẩu</label>
                        <input id="show-new-password" type="checkbox" class="h-4 w-4" onclick="${showNewPassword}">
                    </div>
                </div>
            `;
        }
        
        // Create changing password element
        let changePasswordElement = document.createElement('div');
        changePasswordElement.innerHTML = `
            <div id="change-password-wrapper" class="mt-10 mx-auto max-w-md">
                <div class="mb-6 font-bold text-center text-2xl">Đổi mật khẩu</div>
                <div class="grid grid-cols-1 mx-auto w-full">
                    ${oldPasswordElement.innerHTML}
                    ${newPasswordElement.innerHTML}
                    <div class="mt-2 text-center">
                        <button
                            id="reset-btn"
                            class="
                                mx-1 px-2 py-1 rounded-lg bg-black shadow-lg
                                font-semibold text-white text-center
                                focus:outline-none
                                transform hover:scale-105
                                transition duration-75
                            ">
                            Nhập lại
                        </button>
                        <button
                            id="update-btn"
                            class="
                                mx-1 px-2 py-1 rounded-lg bg-blue-500 shadow-lg
                                font-semibold text-white text-center
                                focus:outline-none
                                transform hover:scale-105
                                transition duration-75
                            ">
                            Cập nhật
                        </button>
                    </div>                
                </div>
            </div>
        `;

        // Remove personal-info.js
        document.querySelector('script[src="/js/personal-info.js"]').remove();

        // Append script for handling updating password
        let updatePasswordScript = document.createElement('script');
        updatePasswordScript.setAttribute('type', 'module');
        updatePasswordScript.setAttribute('src', '/js/update-password.js');
        
        document.body.appendChild(changePasswordElement);
        document.body.appendChild(updatePasswordScript);
    }
}