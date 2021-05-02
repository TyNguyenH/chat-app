import CONFIG from './config.js';
import { notifyNewMessage, syncMessages } from './home-functions.js'


let socket = io();
socket.connect(`${CONFIG.serverAddress}:${CONFIG.serverPort}`, { secure: true });

/*
    {object} activeUsers: {
        userID: {
            userFullName:   {string}
            userSocketID:   {string}
        }
    }
*/
let activeUsers = {};

// Data to transmit between users
let messageData = {
    messageID: null,
    senderID: '',
    recipientID: '',
    recipientGroupID: '',
    messageText: '',
    filePath: null,
    fileType: null,
    isRead: null,
    createDate: ''
};

let notification = null;

// Send current session user info when socket is connected
socket.on('connected', () => {
    const userInfo = document.querySelector('#user-info');
    const userFullName = userInfo.innerHTML.trim();
    const userAvatarSrc = document.querySelector('#user-avatar').getAttribute('src');
    messageData.senderID = Number.parseInt(userID);

    let userData = {
        userID: userID,
        userFullName: userFullName,
        userAvatarSrc: userAvatarSrc,
        userSocketID: socket.id
    };

    // Enable notification if granted
    if (("Notification" in window) && Notification.permission === 'granted') {
        notification = {
            icon: '/favicon.ico',
            title: '',
            body: ''
        }
    }

    socket.emit('user info', userData);
});

// Receive broadcasted message from server when a new user is connected
socket.on('active users', (activeUsersData) => {
    activeUsers = activeUsersData
    console.log('Active users:', activeUsers);
});

// Notify new message
socket.on('message', (messageData) => {
    const senderID = messageData.senderID;
    const friendFullName = activeUsers[senderID].userFullName;
    const avatarSrc = activeUsers[senderID].userAvatarSrc;
    const messageText = messageData.messageText.replace(/[\\]/g, '').trim();

    if (senderID && Notification.permission === 'granted') {
        notification.icon = avatarSrc;
        
        if (messageData.file && messageData.fileType) {
            notification.body = 'Đã gửi bạn hình ảnh';
        } else {
            notification.body = messageText;
        }

        notification.title = friendFullName.trim();
        
        notifyNewMessage(senderID, notification);
    }

    // Store new message to localStorage
    navigator.storage.estimate()
        .then(data => {
            const newMessage = {
                messageID: Number.parseInt(messageData.messageID),
                creatorID: Number.parseInt(messageData.senderID),
                recipientID: Number.parseInt(messageData.recipientID),
                recipientGroupID: Number.parseInt(messageData.recipientGroupID),
                messageText: messageData.messageText,
                filePath: messageData.file,
                fileType: messageData.fileType,
                isRead: messageData.isRead,
                createDate: messageData.createDate
            }

            let friendID;
            if (messageData.senderID != userID) {
                friendID = messageData.senderID;
            } else {
                friendID = messageData.recipientID;
            }

            if (data.usage < data.quota) {
                // Add new message to the beginning of the messages array
                if (localStorage.hasOwnProperty(`friend${friendID}`)) {
                    let existingMessages = JSON.parse(localStorage.getItem(`friend${friendID}`));
                    let newMessages = syncMessages([newMessage], existingMessages);
                    localStorage.setItem(`friend${friendID}`, JSON.stringify(newMessages));
                }

                // Initialize a new array of messages if messages are not found in localStorage
                if (!localStorage.hasOwnProperty(`friend${friendID}`)) {
                    const dateNow = new Date(Date.now());
                    const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

                    const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=20`;
                    const resultOption = `resultMessageID=true&resultCreatorID=true&resultRecipientID=true&resultMessageText=true&resultFilePath=true&resultFileType=true&resultCreateDate=true&resultIsRead=true`;
                    const queryString = `${searchOption}&${resultOption}`;

                    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/messages/option?${queryString}`)
                        .then(response => response.json())
                        .then(data => {
                            /*
                                Array of messages ordered by descending create date
                                messages[0]          --> Lastest
                                messages[length - 1] --> Oldest
                            */

                            let messages = data.messages;

                            messages = JSON.stringify(messages);
                            localStorage.setItem(`friend${friendID}`, messages);
                        })
                }
            }
        })
});


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


const userInfo = document.querySelector('#user-info');
const userID = Number.parseInt(userInfo.getAttribute('data-user-id'));

// Friend list wrapper
let friendListWrapper = document.createElement('div');
friendListWrapper.setAttribute('id', 'friend-list-wrapper');
friendListWrapper.setAttribute('class', 'mb-10 mx-auto max-w-md');
friendListWrapper.innerHTML += `<div class="mb-2 text-xl font-bold">Bạn bè:</div>`;

// Friend request list wrapper
let friendRequestWrapper = document.createElement('div');
friendRequestWrapper.setAttribute('id', 'friend-request-wrapper');
friendRequestWrapper.setAttribute('class', 'mb-10 mx-auto max-w-md');
friendRequestWrapper.innerHTML += `<div class="mb-2 text-xl font-bold">Yêu cầu kết bạn:</div>`;

// Sent friend request list wrapper
let sentFriendRequestWrapper = document.createElement('div');
sentFriendRequestWrapper.setAttribute('id', 'sent-friend-request-wrapper');
sentFriendRequestWrapper.setAttribute('class', 'mb-10 mx-auto max-w-md');
sentFriendRequestWrapper.innerHTML += `<div class="mb-2 text-xl font-bold">Yêu cầu kết bạn đã gửi:</div>`;

// Search result wrapper
let searchResultWrapper = document.createElement('div');
searchResultWrapper.setAttribute('id', 'result-wrapper');
searchResultWrapper.setAttribute('class', 'mb-10 mx-auto max-w-md');


window.onload = () => {
    // Fetch user's friendship data and render those data (request-to list, request-from list, friend list)
    const resultOption = `resultFriendID=true&resultFirstName=true&resultLastName=true&resultAvatar=true&resultFriendStatus=true&resultActionUserID=true`;

    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/option?${resultOption}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const friends = data.friends;

            if (friends.length > 0) {
                let friendList = [];
                let friendRequestFrom = [];
                let friendRequestTo = [];

                for (let friend of friends) {
                    if (friend.friendStatus == 'friend') {
                        friendList.push(friend);
                    }

                    if (friend.friendStatus == 'request' && friend.actionUserID == friend.friendID) {
                        friendRequestFrom.push(friend);
                    }

                    if (friend.friendStatus == 'request' && friend.actionUserID != friend.friendID) {
                        friendRequestTo.push(friend);
                    }
                }

                // Friend list
                if (friendList.length > 0) {
                    friendList.forEach((friend) => {
                        let friendID = friend.friendID;
                        let friendFullName = `${friend.friendLastName} ${friend.friendFirstName}`;
                        let friendAvatarSrc = friend.friendAvatarSrc;

                        friendListWrapper.innerHTML += renderFriendCard(friendID, friendAvatarSrc, friendFullName, 'friend');
                    });

                    document.body.appendChild(friendListWrapper);
                }

                // Friend request(s)
                if (friendRequestFrom.length > 0) {
                    friendRequestFrom.forEach((friend) => {
                        let friendID = friend.friendID;
                        let friendFullName = `${friend.friendLastName} ${friend.friendFirstName}`;
                        let friendAvatarSrc = friend.friendAvatarSrc;

                        friendRequestWrapper.innerHTML += renderFriendCard(friendID, friendAvatarSrc, friendFullName, 'request from');
                    });

                    document.body.appendChild(friendRequestWrapper);
                }

                // Sent friend request(s)
                if (friendRequestTo.length > 0) {
                    friendRequestTo.forEach((friend) => {
                        let friendID = friend.friendID;
                        let friendFullName = `${friend.friendLastName} ${friend.friendFirstName}`;
                        let friendAvatarSrc = friend.friendAvatarSrc;

                        sentFriendRequestWrapper.innerHTML += renderFriendCard(friendID, friendAvatarSrc, friendFullName, 'request to');
                    });

                    document.body.appendChild(sentFriendRequestWrapper);
                }
            }
        });
}


let searchFriendBar = document.querySelector('#search-friend-bar');
let searchInput = document.querySelector('#search-friend-bar > input');

searchFriendBar.onsubmit = (event) => {
    let searchText = searchInput.value;
    let invalidPattern =
        /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựýỳỵỷỹ\s]/g;
    searchText = searchText.replace(invalidPattern, '');
    searchText = searchText.trim();

    if (searchText.length > 0) {
        let lastName = '';
        let firstName = '';
        if (searchText.includes(' ')) {
            lastName = searchText.split(' ')[0];
            firstName = searchText.split(' ')[1];
        } else {
            lastName = searchText;
            firstName = searchText;
        }

        const searchOption = `searchFirstName=${firstName}&searchLastName=${lastName}`;
        const resultOption = `resultFriendID=true&resultFirstName=true&resultLastName=true&resultAvatar=true&resultFriendStatus=true&resultActionUserID=true`;
        const queryString = `${searchOption}&${resultOption}`;

        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/option?${queryString}`)
            .then((response) => response.json())
            .then(data => {
                console.log(data);

                // Hide all friends and display search results
                if (friendListWrapper) {
                    friendListWrapper.style.display = 'none';
                }

                if (friendRequestWrapper) {
                    friendRequestWrapper.style.display = 'none';
                }

                if (sentFriendRequestWrapper) {
                    sentFriendRequestWrapper.style.display = 'none';
                }

                let friends = data.friends ? data.friends : [];
                searchResultWrapper.innerHTML = '';
                searchResultWrapper.innerHTML += `<div class="mb-2 text-xl font-bold">Kết quả tìm kiếm:</div>`;

                if (friends.length == 0) {
                    searchResultWrapper.innerHTML += `<p>Không tìm thấy bạn . . .</p>`;
                } else {
                    for (let friend of friends) {
                        let friendFullName = `${friend.friendLastName} ${friend.friendFirstName}`;

                        let cardType = '';
                        if (friend.friendStatus == 'friend') {
                            cardType = 'friend';
                        }

                        if (friend.friendStatus == '') {
                            cardType = 'nonfriend';
                        }

                        if (friend.friendStatus == 'request' && (friend.actionUserID != userID)) {
                            cardType = 'request from';
                        }

                        if (friend.friendStatus == 'request' && (friend.actionUserID == userID)) {
                            cardType = 'request to';
                        }

                        searchResultWrapper.innerHTML += renderFriendCard(friend.friendID, friend.friendAvatarSrc, friendFullName, cardType);
                    }
                }
                
                document.body.appendChild(searchResultWrapper);
            });
    }
    
    event.preventDefault();
}


// Display back all friends and hide search results when user stops searching friends
searchInput.onkeydown = (event) => {
    if (event.key == 'Escape') {
        searchInput.value = '';
        exitSearchFriend();
        event.currentTarget.blur();
    }
}
searchInput.onchange = exitSearchFriend;

function exitSearchFriend() {
    let searchText = searchInput.value;
    if (searchText.length == 0) {
        if (document.querySelector('#result-wrapper')) {
            let resultWrapper = document.querySelector('#result-wrapper');
            resultWrapper.remove();
        }

        if (friendListWrapper) {
            friendListWrapper.style.display = 'block';
        }

        if (friendRequestWrapper) {
            friendRequestWrapper.style.display = 'block';
        }

        if (sentFriendRequestWrapper) {
            sentFriendRequestWrapper.style.display = 'block';
        }
    }
}