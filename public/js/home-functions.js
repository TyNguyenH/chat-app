import CONFIG from './config.js';


const userInfo = document.querySelector('#user-info');
const userID = userInfo.getAttribute('data-user-id');


// Render friends navigation tab
async function renderFriendsNavTab() {
    const searchOption = `searchFriendStatus=friend`;
    const resultOption = `resultFriendID=true&resultFirstName=true&resultLastName=true&resultAvatar=true&resultFriendStatus=true&resultActionUserID=true`;
    const queryString = `${searchOption}&${resultOption}`;
    
    const data =
        await fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/option?${queryString}`)
            .then(response => response.json())

    let friendsNavTab = document.querySelector('#friends-nav-tab');
    const friends = data.friends;
    console.log('friends:', friends);

    for (let friend of friends) {
        if (friend.friendStatus == 'friend') {
            const friendFullName = `${friend.friendLastName} ${friend.friendFirstName}`;

            const friendAvatar =
                `<div class="flex-shrink-0">
                    <img class="w-16 rounded-full shadow-md" src="${friend.friendAvatarSrc}">
                </div>`;

            const friendInfo =
                `<div class="friend-info flex flex-col ml-2 mr-3 items-start">
                    <div class="friend-fullname px-1 mb-1 text-base font-bold">${friendFullName}</div>
                    <div class="message-snippet pl-1 text-sm text-gray-400 font-normal text-left" data-message-id="" data-message-recipient-id="" data-message-is-read="">
                    </div>
                </div>`;

            const friendTab =
                `<div class="
                        friend-msg-tab inactive
                        relative flex items-center
                        px-2 h-20
                        border-b-2 border-black
                        cursor-pointer
                        hover:bg-gray-200"
                    data-friend-id=${friend.friendID}>
                    ${friendAvatar}
                    ${friendInfo}
                </div>`

            friendsNavTab.innerHTML += friendTab;
        }
    }
}


/* 
    Render one message snippet

    @param {HTMLElement} friendTab - (a tab in friends-navigation tab)
    @param {object} message: {
        messageID:              {number}
        creatorID:              {number}
        recipientID:            {number}
        recipientGroupID:       {number}
        messageText:            {string}
        filePath:               {string}
        fileType:               {string}
        isRead:                 {boolean}
    }
*/
function renderMessageSnippet(friendTab, message) {
    let messageSnippet = friendTab.querySelector('.friend-info > .message-snippet');
    messageSnippet.setAttribute('data-message-creator-id', message.creatorID);
    messageSnippet.setAttribute('data-message-id', message.messageID);
    messageSnippet.setAttribute('data-message-recipient-id', message.recipientID);
    messageSnippet.setAttribute('data-message-is-read', message.isRead);

    // Render the owner of the message
    if (message.creatorID == userID) {
        messageSnippet.innerHTML = 'Bạn: ';
    } else {
        messageSnippet.innerHTML = '';
    }

    // Reduce message's length if it's too long to dislay
    if (message.messageText.length > 40) {
        const shortenedMessage = message.messageText.slice(0, 20) + ' <b>. . .</b>';
        messageSnippet.innerHTML += shortenedMessage.replace(/[\\]/g, '');
    } else {
        messageSnippet.innerHTML += message.messageText.replace(/[\\]/g, '');;
    }

    /* Handle styling of message snippet */
    {
        // Mark unread message with blue dot and make its font become bold
        if (message.recipientID == userID && !message.isRead && !friendTab.querySelector('.notification-dot')) {
            messageSnippet.classList.remove('text-gray-400', 'font-normal');
            messageSnippet.classList.add('font-semibold');
            friendTab.innerHTML += `<div class="notification-dot"><img src="/imgs/blue-dot.png" class="absolute right-0 mr-2 w-3"></div>`;
        }

        // Delete message's blue notification dot and make its font become light
        if (message.recipientID == userID && message.isRead) {
            if (messageSnippet.classList.contains('font-semibold')) {
                messageSnippet.classList.remove('font-semibold');
            }

            if (!messageSnippet.classList.contains('text-gray-400') && !messageSnippet.classList.contains('font-normal')) {
                messageSnippet.classList.add('text-gray-400', 'font-normal');
            }

            if (friendTab.querySelector('.notification-dot')) {
                friendTab.querySelector('.notification-dot').remove();
            }
        }
    }
}


// Get messages and display message snippet on each friend tab
function renderAllMessageSnippets() {
    const userID = document.querySelector('#user-info').getAttribute('data-user-id');
    const dateNow = new Date(Date.now());
    const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

    let friendsNavTab = document.querySelector('#friends-nav-tab').children;
    for (let friendTab of friendsNavTab) {
        const friendID = friendTab.getAttribute('data-friend-id');
        const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=1`;
        const resultOption = `resultMessageID=true&resultCreatorID=true&resultRecipientID=true&resultMessageText=true&resultIsRead=true`;
        const queryString = `${searchOption}&${resultOption}`;

        fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/messages/option?${queryString}`)
            .then(response => response.json())
            .then(data => {
                // Returned data will be an array containing one object (message data)
                if (data.messages[0]) {
                    const message = data.messages[0];
                    renderMessageSnippet(friendTab, message);
                }
            });
    }
}


/* 
    Create and return a complete message
    Note: messageTimestamp format: 'DD-MM-YYYY 24HH-MM-SS'
*/
function renderMessage(msgID, msgCreator, msgAvatarSrc, msgText, msgImageSrc, messageTimestamp) {
    let messageElement = '';
    let messageStyling = '';
    let avatarElement = '';
    let textElement = '';
    let imgElement = '';
    let timestampElement = '';


    if (msgCreator == 'my-message') {
        messageStyling = 'my-message inline-block float-right clear-both mb-6 max-w-sm text-right';
    }

    if (msgCreator == 'friend-message') {
        messageStyling = 'friend-message inline-block float-left clear-both mb-6 max-w-sm text-left';
    }

    if (msgAvatarSrc) {
        avatarElement = `<div class="flex-shrink-0 self-start"><img src="${msgAvatarSrc}" class="mr-2 w-7 h-7 shadow-md rounded-full"></div>`;
    }

    if (msgText.length > 0) {
        let textColor = '';
        let bgColor = '';

        if (msgCreator == 'my-message') {
            textColor = 'text-white';
            bgColor = 'bg-blue-500';
        }

        if (msgCreator == 'friend-message') {
            textColor = 'text-black';
            bgColor = 'bg-gray-200';
        }

        msgText = msgText.replace(/[\\]/g, '');
        textElement = `<div class="message-body rounded-lg px-2 py-1 ${bgColor} break-words text-justify ${textColor}">${msgText}</div>`;
    }

    if (msgImageSrc) {
        imgElement = `<img src="${msgImageSrc}" alt="image" class="rounded-lg">`;
    }

    if (messageTimestamp) {
        let dateNow = new Date(Date.now());
        let date = dateNow.getDate() >= 10 ? dateNow.getDate() : ('0' + dateNow.getDate());
        let month = dateNow.getMonth() >= 10 ? dateNow.getDate() : ('0' + (dateNow.getMonth() + 1));
        let year = dateNow.getFullYear();
        dateNow = `${date}-${month}-${year}`;

        const dateCreated = messageTimestamp.split(' ')[0];
        const timeCreated = messageTimestamp.split(' ')[1];
        let timestamp = '';
        if (dateCreated == dateNow) {
            // 24HH:MM:SS
            const hour = timeCreated.split(':')[0];
            const minute = timeCreated.split(':')[1];
            timestamp = `${hour}:${minute}`;
        } else {
            const messageYear = dateCreated.split('-')[2];
            const currentYear = new Date(Date.now()).getFullYear();
            if (messageYear == currentYear) {
                // DD-MM
                timestamp = `${dateCreated.split('-')[0]}-${dateCreated.split('-')[1]}`;
            } else {
                // DD-MM-YYYY
                timestamp = dateCreated;
            }
        }

        timestampElement = `
            <div class="message-timestamp text-sm ${msgCreator == 'friend-message' ? 'ml-10' : ''}">
                ${timestamp}
            </div>
        `;
    }

    messageElement =
        `<div class="${messageStyling}" data-message-id=${msgID}>
            <div class="flex flex-row justify-between">
                ${avatarElement}
                ${textElement}
                ${imgElement}
            </div>
            ${timestampElement}
        </div>`;

    return messageElement;
}


/*
    Render all messages in chat message box, given an array of messages
    
    //
    @param {array} messages: [
        {object} message: {
            messageID:              {number}
            creatorID:              {number}
            recipientID:            {number}
            recipientGroupID:       {number}
            messageText:            {string}
            filePath:               {string}
            fileType:               {string}
            isRead:                 {boolean}
            createDate:             {string}
        },
        ...
    ]
    
    @param {object} - friendsNavTab = {
        friendID: { HTMLElement },
        ...
    }
*/ 
function renderMessagesBox(friendsNavTab, messages) {
    console.log(friendsNavTab);
    let chatMsgBox = document.querySelector('#messages-box');
    chatMsgBox.innerHTML = '';

    if (messages && messages.length > 0) {
        for (let message of messages) {
            let messageCreator = '';
            if (message.creatorID != userID) {
                messageCreator = 'friend-message';
            } else {
                messageCreator = 'my-message';
            }

            // TODO: handle message file if filePath & fileType found in message

            const creatorID = message.creatorID;
            const friendTab = friendsNavTab[creatorID];
            let creatorAvatar = '';
            if (friendTab) {
                creatorAvatar = friendTab.querySelector('div > img').getAttribute('src');
            } else {
                creatorAvatar = null
            }

            chatMsgBox.innerHTML = renderMessage(message.messageID, messageCreator, creatorAvatar, message.messageText, null, message.createDate) + chatMsgBox.innerHTML;
        }

        // Handle message status (sent/seen)
        const newestMessage = messages[0];
        if (newestMessage.creatorID == userID) {
            let messageStatus = document.querySelector('#message-status');
            if (messageStatus) {
                if (newestMessage.isRead) {
                    messageStatus.innerHTML = 'Đã xem';
                } else {
                    messageStatus.innerHTML = 'Đã gửi';
                }
            } else {
                let messageStatus = document.createElement('div');
                messageStatus.setAttribute('id', 'message-status');
                messageStatus.setAttribute('class', 'clear-both float-right text-sm -mt-6');

                if (newestMessage.isRead) {
                    messageStatus.innerHTML = 'Đã xem';
                } else {
                    messageStatus.innerHTML = 'Đã gửi';
                }

                chatMsgBox.appendChild(messageStatus);
            }
        }
    }
}


export { renderFriendsNavTab, renderMessageSnippet, renderAllMessageSnippets, renderMessage, renderMessagesBox };