import CONFIG from './config.js';
import { renderFriendCard, notifyNewMessage } from './friend-list-functions.js'
import { syncMessages, addMessageToSessionStorage } from './home-functions.js'


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

    // Notify new message if notification permission is 'granted'
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

    // Store new message to sessionStorage
    {
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

        addMessageToSessionStorage(newMessage);
    }
});





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

// Searching animation element
const loadingAnimationDiv = document.createElement('div');
loadingAnimationDiv.setAttribute('id', 'loading-animation');
loadingAnimationDiv.setAttribute('class', 'flex flex-col items-center justify-center mt-24 mb-4 w-full');
loadingAnimationDiv.innerHTML = `
    <div class="mx-auto animate-spin w-16 h-16 rounded-full border-8 border-gray-200"
        style="border-top-color: #1D4ED8;">
    </div>
    <div class="mt-2">Đang tìm bạn bè</div>
`;

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
        /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựýỳỵỷỹ\s0-9]/g;
    searchText = searchText.replace(invalidPattern, '');
    searchText = searchText.trim();

    if (searchText.length > 0) {
        let friendID = null;
        let lastName = '';
        let firstName = '';

        // FriendID searching
        const tempFriendID = Number.parseInt(searchText);
        if (tempFriendID && tempFriendID != userID) {
            friendID = Number.parseInt(searchText);
        }

        // Mulitple words searching (>= 2 words)
        if (searchText.includes(' ')) {
            lastName = searchText.split(' ')[0];
            firstName = searchText.split(' ')[1];
        }
        
        // One word searching
        if (!searchText.includes(' ') && !tempFriendID) {
            lastName = searchText;
            firstName = searchText;
        }


        let searchOption = '';
        if (firstName && lastName) {
            searchOption = `searchFirstName=${firstName}&searchLastName=${lastName}`;
        } else if (friendID) {
            searchOption = `searchFriendID=${friendID}`;
        } else {
            return false;
        }
        
        const resultOption = `resultFriendID=true&resultFirstName=true&resultLastName=true&resultAvatar=true&resultFriendStatus=true&resultActionUserID=true`;
        const queryString = `${searchOption}&${resultOption}`;

        // Add loading animation when searching for friends
        if (!document.body.querySelector('#loading-animation')) {
            // Remove searchResultWrapper so that searching animation can be displayed below searchFriendBar
            if (document.body.querySelector('#result-wrapper')) {
                document.body.querySelector('#result-wrapper').remove();
            }
            
            document.body.appendChild(loadingAnimationDiv);
        }

        // Hide all friends and display search results
        {
            if (friendListWrapper) {
                friendListWrapper.style.display = 'none';
            }

            if (friendRequestWrapper) {
                friendRequestWrapper.style.display = 'none';
            }

            if (sentFriendRequestWrapper) {
                sentFriendRequestWrapper.style.display = 'none';
            }
        }

        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/option?${queryString}`)
            .then((response) => response.json())
            .then(data => {
                // Remove searching animation when data is fully fetched
                if (document.body.querySelector('#loading-animation')) {
                    document.body.querySelector('#loading-animation').remove();
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
                
                // Add small delay time for smoothing experience
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