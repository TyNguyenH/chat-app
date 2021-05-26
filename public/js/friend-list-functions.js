import CONFIG from './config.js';

function renderFriendCard(friendID, friendAvatarSrc, friendFullName, cardType) {
    let cardFriendInfo =
        `<div class="flex items-center">
            <img src="${friendAvatarSrc}" alt="avatar"
                class="shadow-md rounded-full h-11 w-11 mr-2">
            <span id="friend-fullname" class="font-semibold text-lg">
                ${friendFullName}
            </span>
        </div>`

    let cardFunctions = '';

    // Nonfriend
    if (cardType == 'nonfriend') {
        let onclick =
            `fetch('${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/add-friend/${friendID}', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.msg == 'success') {
                        location.reload();
                    } else if (data.msg == 'error') {
                        console.log('Error adding friend');
                    }
                });
            `;

        cardFunctions =
            `<div class="flex items-center">
                <button 
                    class="
                        mx-1 px-2 py-1 rounded-lg bg-blue-500 shadow-md
                        font-semibold text-white text-center
                        focus:outline-none
                        transform hover:scale-105
                        transition duration-75"
                    onclick="${onclick}">
                    Thêm bạn
                </button>
            </div>`;
    }

    // A friend
    if (cardType == 'friend') {
        let onclick =
            `fetch('${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/unfriend/${friendID}', { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.msg == 'success') {
                        location.reload();
                    } else if (data.msg == 'error') {
                        console.log('Error unfriend');
                    }
                });
            `;

        cardFunctions =
            `<div class="flex items-center">
                <button 
                    class="
                        mx-1 px-2 py-1 rounded-lg bg-gray-500 shadow-md
                        font-semibold text-white text-center
                        focus:outline-none
                        transform hover:scale-105
                        transition duration-75"
                    onclick="${onclick}">
                    Hủy kết bạn
                </button>
            </div>`;
    }

    // A friend request
    if (cardType == 'request from') {
        let accept = `fetch('${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/accept/${friendID}', { method: 'PUT' })`;

        let decline = `fetch('${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/decline/${friendID}', { method: 'DELETE' })`;

        let onclick =
            `.then(response => response.json())
            .then(data => {
                if (data.msg == 'success') {
                    location.reload();
                } else if (data.msg == 'error') {
                    console.log('Error handling friend request');
                }
            });
            `;

        cardFunctions =
            `<div class="flex items-center">
                <button 
                    class="
                        mx-1 px-2 py-1 rounded-lg bg-blue-500 shadow-md
                        font-semibold text-white text-center
                        focus:outline-none
                        transform hover:scale-105
                        transition duration-75"
                    onclick="${accept}${onclick}">
                    Chấp nhận
                </button>
                <button 
                    class="
                        mx-1 px-2 py-1 rounded-lg bg-white shadow-md
                        font-semibold text-center
                        focus:outline-none
                        transform hover:scale-105
                        transition duration-75"
                    onclick="${decline}${onclick}">
                    Hủy
                </button>
            </div>`;
    }

    // A sent friend request
    if (cardType == 'request to') {
        let onclick =
            `fetch('${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/unfriend/${friendID}', { method: 'DELETE' })
                .then(response => response.json())
                .then(data => {
                    if (data.msg == 'success') {
                        location.reload();
                    } else if (data.msg == 'error') {
                        console.log('Error unfriend');
                    }
                });
            `;

        cardFunctions =
            `<div class="flex items-center">
                <button 
                    class="
                        mx-1 px-2 py-1 rounded-lg bg-white shadow-md
                        font-semibold text-center
                        focus:outline-none
                        transform hover:scale-105
                        transition duration-75"
                    onclick="${onclick}">
                    Đã gửi yêu cầu
                </button>
            </div>`;
    }

    const finalCard =
        `<div data-friend-id=${friendID} data-card-type="${cardType}"
            class="friend-card flex justify-between items-center border border-gray-400 mb-4 mx-auto px-3 py-2 shadow-lg rounded-lg
            bg-gray-200">
            ${cardFriendInfo}
            ${cardFunctions}
        </div>`;

    return finalCard;
}


/*
    Create a new notification
    @param {object} - notification: {
        icon:
        title:
        body:
    }
*/
function notifyNewMessage(senderID, notification) {
    let options = {
        body: notification.body,
        icon: notification.icon
    }

    let newNotification = new Notification(notification.title, options);

    newNotification.onclick = () => {
        location.href = `/home?notification=true&senderID=${senderID}`;

        const receiveMsgAudio = new Audio('/audio/new-message-notification.mp3');
        receiveMsgAudio.play();
    }
}


export {
    renderFriendCard,
    notifyNewMessage
}