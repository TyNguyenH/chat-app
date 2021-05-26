import CONFIG from '../js/config.js';


// Used for pagination
let pages = [];

window.onload = () => {
    // Get registration mode
    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-mode`)
        .then(res => res.json())
        .then(data => {
            if (data) {
                const accountRegConfig = data;

                let verifyEmailModeButton = document.querySelector('#registration-mode > #verify-email-mode');
                let manualModeButton = document.querySelector('#registration-mode > #manual-mode');

                if (accountRegConfig.registrationMode == 'verify email') {
                    verifyEmailModeButton.style.backgroundColor = '#3B82F6';
                    verifyEmailModeButton.style.color = 'white';
                }

                if (accountRegConfig.registrationMode == 'manual') {
                    manualModeButton.style.backgroundColor = '#3B82F6';
                    manualModeButton.style.color = 'white';
                }
            }
        });
    

    // Get current total registration requests and render number pages
    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-request-count`)
        .then(res => res.json())
        .then(data => {
            const totalRegistrationRequests = data.totalRegistrationRequests;
            if (totalRegistrationRequests) {
                let registrationRequestList = document.querySelector('#registration-requests');
                if (totalRegistrationRequests == 0) {
                    registrationRequestList.innerHTML = '<div class="py-10 text-md">Không có tài khoản nào đang chờ duyệt</div>';
                }

                let offset = 0;
                let limit = 10;
                let pagingWrapper = document.querySelector('#paging-wrapper');
                const totalPage = Math.ceil(totalRegistrationRequests / 10);

                for (let pageNumber = 1; pageNumber <= totalPage; pageNumber += 1) {
                    let pageNumberSelector = document.createElement('div');
                    pageNumberSelector.setAttribute('class', 'border border-black cursor-pointer hover:bg-gray-200 transition duration-75 rounded-md shadow mx-2 w-6 font-semibold text-center');
                    pageNumberSelector.innerHTML = pageNumber;
                    
                    // Get registration requests when click page number
                    const pageNumberSelectorURL = `${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-request/option?limit=${limit}&offset=${offset}`;
                    pageNumberSelector.onclick = () => {
                        registrationRequestList.innerHTML = '';

                        fetch(pageNumberSelectorURL)
                            .then(res => res.json())
                            .then(data => {
                                const registrationRequests = data;

                                for (const request of registrationRequests) {
                                    let requestWrapper = document.createElement('div');
                                    requestWrapper.setAttribute('class', 'flex flex-row rounded-lg shadow-md bg-gray-100 my-6 py-3 text-lg text-center items-center')
                                    requestWrapper.setAttribute('data-request-id', request.requestID);
                                    requestWrapper.innerHTML = `
                                        <div class="w-2/12">
                                            <img src="${request.avatar}" class="mx-auto flex-shrink-0 w-20 h-20 border border-black rounded-full shadow-md">
                                        </div>
                                        <div class="w-4/12 break-words">
                                            ${request.lastName} ${request.firstName}
                                        </div>
                                        <div class="w-3/12">
                                            ${request.requestTime}
                                        </div>
                                        <div class="w-3/12 flex justify-center items-center">
                                            <button class="
                                                accept-btn
                                                mx-1 px-2 py-1
                                                cursor-pointer outline-none
                                                bg-blue-500 rounded-lg shadow-md
                                                text-white font-semibold
                                                focus:outline-none hover:shadow-lg
                                                transform hover:scale-105
                                                transition duration-75
                                            ">
                                                Chấp nhận
                                            </button>

                                            <button class="
                                                deny-btn
                                                mx-1 px-2 py-1
                                                cursor-pointer outline-none
                                                bg-red-500 rounded-lg shadow-md
                                                text-white font-semibold
                                                focus:outline-none hover:shadow-lg
                                                transform hover:scale-105
                                                transition duration-75
                                            ">
                                                Từ chối
                                            </button>
                                        </div>
                                    `;

                                    registrationRequestList.appendChild(requestWrapper);
                                }

                                // Assign onclick event for accept and deny button
                                for (let request of registrationRequestList.children) {
                                    const requestID = Number.parseInt(request.getAttribute('data-request-id'));

                                    let acceptBtn = request.querySelector('.accept-btn');
                                    let denyBtn = request.querySelector('.deny-btn');
                                    
                                    acceptBtn.onclick = () =>{
                                        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-request/accept/${requestID}`, { method: 'POST' })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.message == 'success') {
                                                    location.reload();
                                                } else {
                                                    alert('Database error');
                                                }
                                            })
                                    }

                                    denyBtn.onclick = () => {
                                        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-request/deny/${requestID}`, { method: 'DELETE' })
                                            .then(res => res.json())
                                            .then(data => {
                                                if (data.message == 'success') {
                                                    location.reload();
                                                } else {
                                                    alert('Database error');
                                                }
                                            })
                                    }
                                }
                            });
                    }

                    pagingWrapper.appendChild(pageNumberSelector);
                    offset += 10;

                    // Automatically click first page
                    if (pageNumber == 1) {
                        pageNumberSelector.click();
                    }
                }
            }
        });
}




let verifyEmailModeButton = document.querySelector('#registration-mode > #verify-email-mode');
let manualModeButton = document.querySelector('#registration-mode > #manual-mode');

// 'Verify email' mode button
verifyEmailModeButton.onclick = () => {
    const accountRegConfig = {
        registrationMode: 'verify email'
    }

    const option = {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountRegConfig)
    }

    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-mode`, option)
        .then(res => res.json())
        .then(data => {
            if (data) {
                if (data.message == 'success') {
                    manualModeButton.style.backgroundColor = 'white';
                    manualModeButton.style.color = 'black';

                    verifyEmailModeButton.style.backgroundColor = '#3B82F6';
                    verifyEmailModeButton.style.color = 'white';
                } else {
                    console.log(data);
                }
            }
        })
}

// 'Manual' mode button
manualModeButton.onclick = () => {
    const accountRegConfig = {
        registrationMode: 'manual'
    }

    const option = {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountRegConfig)
    }

    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/admin-api/registration-mode`, option)
        .then(res => res.json())
        .then(data => {
            if (data) {
                if (data.message == 'success') {
                    verifyEmailModeButton.style.backgroundColor = 'white';
                    verifyEmailModeButton.style.color = 'black';

                    manualModeButton.style.backgroundColor = '#3B82F6';
                    manualModeButton.style.color = 'white';
                } else {
                    console.log(data);
                }
            }
        })
}