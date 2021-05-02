import CONFIG from './config.js';

fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/personal-info`)
    .then(response => response.json())
    .then(data => {
        let userAvatarSrc = document.querySelector('#avatar');
        userAvatarSrc.setAttribute('src', data.avatarSrc);

        let lastNameInfo = document.querySelector('#last-name');
        lastNameInfo.textContent = data.lastName;

        let firstNameInfo = document.querySelector('#first-name');
        firstNameInfo.textContent = data.firstName;

        let emailInfo = document.querySelector('#email');
        emailInfo.textContent = data.email;

        let joinDate = document.querySelector('#join-date');
        joinDate.textContent = data.dateJoined;

        let activeStatus = document.querySelector('#active-status');

        if (data.isActive == true) {
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

        if (data.isActive == false) {
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
    })