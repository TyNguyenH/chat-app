import CONFIG from './config.js';


const userInfo = document.querySelector('#user-info');
const userID = userInfo.getAttribute('data-user-id');

// Element that takes user's file input(s)
let messageFileInput = document.querySelector('#message-file-input');

// File(s) previewing wrapper
let filesPreviewWrapper = document.querySelector('#files-preview-wrapper');

// File(s) previewing element (contain all files that are going to be previewed)
let filesPreview = document.querySelector('#files-preview');


// Render friends navigation tab
async function renderFriendsNavTab() {
    let friendsNavTab = document.querySelector('#friends-nav-tab');
    friendsNavTab.innerHTML += 
        '<div class="py-1 h-10 border-b-2 border-black bg-gray-200 rounded-tr-lg text-lg text-center font-bold">Bạn chat</div>';

    const searchOption = `searchFriendStatus=friend`;
    const resultOption = `resultFriendID=true&resultFirstName=true&resultLastName=true&resultAvatar=true&resultFriendStatus=true`;
    const queryString = `${searchOption}&${resultOption}`;
    
    const data =
        await fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/friend-list/option?${queryString}`)
            .then(response => response.json())

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
    if (message.messageText && !message.file) {
        if (message.messageText.length > 40) {
            const shortenedMessage = message.messageText.slice(0, 20) + ' <b>. . .</b>';
            messageSnippet.innerHTML += shortenedMessage.replace(/[\\]/g, '');
        } else {
            messageSnippet.innerHTML += message.messageText.replace(/[\\]/g, '');;
        }
    }

    if ((message.filePath && !message.messageText) || (message.file && message.messageText)) {
        messageSnippet.innerHTML += 'Đã gửi hình ảnh';
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
        if (friendTab.getAttribute('data-friend-id')) {
            const friendID = friendTab.getAttribute('data-friend-id');
            const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=1`;
            const resultOption = `resultMessageID=true&resultCreatorID=true&resultRecipientID=true&resultMessageText=true&resultFilePath=true&resultFileType=true&resultIsRead=true`;
            const queryString = `${searchOption}&${resultOption}`;

            fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/messages/option?${queryString}`)
                .then(response => response.json())
                .then(data => {
                    // Returned data will be an array containing one object (message data)
                    if (data.messages[0]) {
                        const message = data.messages[0];
                        console.log(message);
                        renderMessageSnippet(friendTab, message);
                    }
                });
        }
    }
}


/* 
    Create and return a complete message
    Note: messageTimestamp format: 'DD-MM-YYYY 24HH-MM-SS'
*/
function renderMessage(msgID, msgCreator, msgAvatarSrc, msgText, msgImageSrc, msgTimestamp, msgIsRead) {
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

    if (msgText && msgText.length > 0) {
        let textColor = '';
        let bgColor = '';
        let alignSelf = '';

        if (msgCreator == 'my-message') {
            textColor = 'text-white';
            bgColor = 'bg-blue-500';
            alignSelf = 'self-end';
        }

        if (msgCreator == 'friend-message') {
            textColor = 'text-black';
            bgColor = 'bg-gray-200';
            alignSelf = 'self-start';
        }

        msgText = msgText.replace(/[\\]/g, '');
        textElement = `<div class="message-body flex-shrink-0 ${alignSelf} rounded-lg px-2 py-1 ${bgColor} break-words text-justify ${textColor}">${msgText}</div>`;
    }

    if (msgImageSrc) {
        imgElement = `<img src="${msgImageSrc}" alt="image" class="rounded-lg">`;
    }

    if (msgTimestamp) {
        let dateNow = new Date(Date.now());
        let date = dateNow.getDate() >= 10 ? dateNow.getDate() : ('0' + dateNow.getDate());
        let month = dateNow.getMonth() >= 10 ? (dateNow.getMonth() + 1) : ('0' + (dateNow.getMonth() + 1));
        let year = dateNow.getFullYear();

        // DD-MM-YYYY
        dateNow = `${date}-${month}-${year}`;

        // DD-MM-YYYY
        const dateCreated = msgTimestamp.split(' ')[0];

        // HH24:MM:SS
        const timeCreated = msgTimestamp.split(' ')[1];
        
        let timestamp = '';
        if (dateCreated == dateNow) {
            // HH24:MM:SS
            const hour = timeCreated.split(':')[0];
            const minute = timeCreated.split(':')[1];
            timestamp = `${hour}:${minute}`;
        } else {
            const messageYear = dateCreated.split('-')[2];
            const currentYear = new Date(Date.now()).getFullYear();
            if (messageYear == currentYear) {
                // Convert DD-MM to DD/MM
                timestamp = `${dateCreated.split('-')[0]}/${dateCreated.split('-')[1]}`;
            } else {
                // Convert DD-MM-YYYY to DD/MM/YYYY
                timestamp = dateCreated.replace('-', '/');
            }
        }

        timestampElement = `
            <div class="message-timestamp text-sm ${msgCreator == 'friend-message' ? 'ml-10' : ''}">
                ${timestamp}
            </div>
        `;
    }

    let msgDataIsRead = '';
    if (msgIsRead == true || msgIsRead == false) {
        msgDataIsRead = `data-message-is-read=${msgIsRead}`;
    }

    messageElement =
        `<div class="${messageStyling}" data-message-id=${msgID} ${msgDataIsRead}>
            <div class="flex flex-row">
                ${avatarElement}
                <div class="flex flex-col justify-between">
                    ${textElement}
                    ${imgElement}
                </div>
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
    
    @param {object} - friendsNavTab: {
        friendID: { HTMLElement },
        ...
    }
*/ 
function renderMessagesBox(friendsNavTab, messages) {
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

            const creatorID = message.creatorID;
            const friendTab = friendsNavTab[creatorID];
            let creatorAvatar = '';
            if (friendTab) {
                creatorAvatar = friendTab.querySelector('div > img').getAttribute('src');
            } else {
                creatorAvatar = null
            }

            let imgSrc = null;
            if (message.filePath) {
                imgSrc = message.filePath;
            }

            chatMsgBox.innerHTML = renderMessage(message.messageID, messageCreator, creatorAvatar, message.messageText, imgSrc, message.createDate, message.isRead) + chatMsgBox.innerHTML;
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


/* 
    Synchronize (merge) 2 array of messages together 
    @param {array} messagesArray1, {array} messagesArray2: [
        {object}: {
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
*/
function syncMessages(messagesArray1, messagesArray2) {
    if (Array.isArray(messagesArray1) && Array.isArray(messagesArray2)) {
        const filterObject = (object) => {
            let result = {};

            for (let key of Object.keys(object)) {
                if (object.hasOwnProperty(key) && object[key]) {
                    result[key] = object[key];
                }
            }

            return result;
        };

        const checkMessageInfo = (message) => {
            if (message) {
                let legit = true;

                if (!message.creatorID || !message.recipientID || (!message.messageText || !message.filePath) || !message.createDate || (message.isRead != true || message.isRead != false)) {
                    legit = false;
                }

                return legit;
            } else {
                return false;
            }
        }

        const array1Len = messagesArray1.length;
        const array2Len = messagesArray2.length;
        let messagesResult = [];
        let index1 = 0;
        let index2 = 0;

        while (index1 < array1Len || index2 < array2Len) {
            if (messagesArray1[index1].messageID == messagesArray2[index2].messageID) {
                const message1 = filterObject(messagesArray1[index1]);
                const message2 = filterObject(messagesArray2[index2]);
                if (Object.keys(message1).length > Object.keys(message2).length) {
                    messagesResult.push(message1);
                }

                if (Object.keys(message1).length < Object.keys(message2).length) {
                    messagesResult.push(message2);
                }

                if (Object.keys(message1).length == Object.keys(message2).length) {
                    if (checkMessageInfo(message1)) {
                        messagesResult.push(message1);
                    }

                    if (checkMessageInfo(message2)) {
                        messagesResult.push(message2);
                    }
                }

                index1 += 1;
                index2 += 1;
            }

            if ((messagesArray1[index1] && messagesArray2[index2]) && messagesArray1[index1].messageID > messagesArray2[index2].messageID) {
                messagesResult.push(messagesArray1[index1]);
                index1 += 1;
            }

            if ((messagesArray1[index1] && messagesArray2[index2]) && messagesArray1[index1].messageID < messagesArray2[index2].messageID) {
                messagesResult.push(messagesArray2[index2]);
                index2 += 1;
            }


            if (index1 == array1Len && index2 < array2Len) {
                while (index2 < array2Len) {
                    messagesResult.push(messagesArray2[index2]);
                    index2 += 1;
                }
            }

            if (index2 == array2Len && index1 < array1Len) {
                while (index1 < array1Len) {
                    messagesResult.push(messagesArray1[index1]);
                    index1 += 1;
                }
            }
        }

        return messagesResult;
    }
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
        const receiveMsgAudio = new Audio('/audio/new-message-notification.mp3');
        receiveMsgAudio.play();

        location.href = `/home?notification=true&senderID=${senderID}`;
    }
}


// Promise-wrapped file reading as data URL
function readFileAsDataURLAsync(file) {
    return new Promise((resolve, reject) => {
        let fileReader = new FileReader();
        
        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = reject;

        fileReader.readAsDataURL(file);
    })
}


// Promise-wrapped file reading as array buffer
function readFileAsArrayBufferAsync(file) {
    return new Promise((resolve, reject) => {
        let fileReader = new FileReader();

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = reject;

        fileReader.readAsArrayBuffer(file);
    })
}


// Preview image(s) before sending image(s)
function previewFiles() {
    // Unhide image(s) previewing
    if (messageFileInput.files.length > 0) {
        if (filesPreviewWrapper.classList.contains('hidden')) {
            filesPreviewWrapper.classList.remove('hidden');
        }

        let counter = 0;
        filesPreview.innerHTML = '';
        for (let file of messageFileInput.files) {
            if (file.type.includes('image')) {
                let fileReader = new FileReader();

                // Create loading div to represent loading image status
                fileReader.onloadstart = () => {
                    let loadingElement = document.createElement('div');
                    loadingElement.setAttribute('id', `loading-img-preview-${counter}`);
                    loadingElement.setAttribute('class', 'm-2 p-2 w-20 flex-grow-0 font-semibold text-center align-middle');
                    loadingElement.innerHTML = 'Đang tải . . .';

                    filesPreview.appendChild(loadingElement);
                }

                // Show image previewing and delete loading image status when image is fully loaded
                fileReader.onload = (event) => {
                    let imageElement = document.createElement('img');
                    imageElement.setAttribute('class', 'm-2 w-20 flex-grow-0');
                    imageElement.setAttribute('src', event.target.result);

                    if (document.querySelector(`#loading-img-preview-${counter}`)) {
                        let loadingElement = document.querySelector(`#loading-img-preview-${counter}`);
                        filesPreview.replaceChild(imageElement, loadingElement);
                    }
                }

                fileReader.readAsDataURL(file);

                counter += 1;
            }
        }

        // Automatically scroll to bottom of page, so that user can see image(s) previewing
        window.scrollTo(0, document.body.scrollHeight);
    }
}


export { 
    renderFriendsNavTab,
    renderMessageSnippet,
    renderAllMessageSnippets,
    renderMessage,
    renderMessagesBox,
    syncMessages,
    notifyNewMessage,
    readFileAsDataURLAsync,
    readFileAsArrayBufferAsync,
    previewFiles 
};