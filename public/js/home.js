import CONFIG from './config.js';
import { renderFriendsNavTab, renderMessageSnippet, renderAllMessageSnippets, renderMessage, renderMessagesBox, addMessageToSessionStorage, previewFiles } from './home-functions.js';


let socket = io();
socket.connect(`${CONFIG.serverAddress}:${CONFIG.serverPort}`, { secure: true });

// Used to save whole page content (state)
let bodyContent = null;

const userInfo = document.querySelector('#user-info');
const userID = userInfo.getAttribute('data-user-id');

// Data to transmit between users
let messageData = {
    messageID: null,
    senderID: '',
    recipientID: '',
    recipientGroupID: '',
    messageText: '',
    file: null,
    startChunk: null,
    endChunk: null,
    fileSize: null,
    fileType: null,
    isRead: null,
    createDate: ''
};

/* 
    Temporary whole file for transfering (this file will be sliced into chunks so that the client can send each chunk at a time) 
    tempFileChunks = {
        messageID: ArrayBuffer {Uint8Array},
        ...
    }
*/
let tempFileChunks = {};

/*
    This object is used for fetching old messages and merging them into new ones
    messageCount = {
        friendID: {
            offset: {number}
            limit:  {number}
        }
    }
*/ 
let messagesCount = {}

/* 
    Big left side tab that displays all friend tabs
    friendsNavTab = {
        friendID: { HTMLElement },
        ...
    }
*/
let friendsNavTab = {};

// A form element that is used to send messages between users
let form = document.querySelector('form');

// Element that takes user's text input
let messageTextInput = document.querySelector('#message-text-input');

// Element that holds and shows all messages between users
let chatMsgBox = document.querySelector('#messages-box');
chatMsgBox.style['scroll-behavior'] = 'auto';

// Loading animation element
const loadingAnimationDiv = document.createElement('div');
loadingAnimationDiv.setAttribute('id', 'loading-animation');
loadingAnimationDiv.setAttribute('class', 'flex flex-col items-center justify-center mb-4 w-full clear-both');
loadingAnimationDiv.innerHTML = `
    <div class="mx-auto animate-spin w-8 h-8 rounded-full border-4 border-gray-200"
        style="border-top-color: #1D4ED8;">
    </div>
    <div>??ang t???i</div>
`;

// Creating typing feedback element
let typingFeedback = document.createElement('div');
typingFeedback.innerHTML = '<img src=""><b>. . .</b>';
typingFeedback.setAttribute('id', 'typing-feedback');
typingFeedback.setAttribute('class', 'flex flex-row clear-both float-left');
typingFeedback.querySelector('b').setAttribute('class', 'animate-pulse inline clear-both mb-4 text-left rounded-lg px-2 bg-gray-300 text-xl font-bold text-center');

// Creating message status element
let messageStatus = document.createElement('div');
messageStatus.setAttribute('id', 'message-status');
messageStatus.setAttribute('class', 'clear-both float-right text-sm -mt-6');

// Element that takes user's file input(s)
let messageFileInput = document.querySelector('#message-file-input');

// File(s) previewing wrapper
let filesPreviewWrapper = document.querySelector('#files-preview-wrapper');

// File(s) previewing element (contain all files that are going to be previewed)
let filesPreview = document.querySelector('#files-preview');






window.onload = async () => {
    await renderFriendsNavTab();

    // Request access notification
    if (("Notification" in window) && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    // Assign values to global "friendsNavTab" object
    let tempFriendsNavTab = document.querySelector('#friends-nav-tab');
    for (let friendTab of tempFriendsNavTab.children) {
        const friendID = friendTab.getAttribute('data-friend-id');
        if (friendID) {
            friendsNavTab[friendID] = friendTab;
        }
    }

    console.log(friendsNavTab);
    renderAllMessageSnippets();
    
    /* Add onclick event to each friend tab */
    for (let friendID in friendsNavTab) {
        let friendTab = friendsNavTab[friendID];

        // Reset fetching old messages config
        messagesCount[friendID] = {};
        messagesCount[friendID].offset = 0;
        messagesCount[friendID].limit = 20;

        friendTab.onclick = async function (event) {
            // Get friend's full name from friend tab
            const friendID = friendTab.getAttribute('data-friend-id');
            const friendFullName = friendTab.querySelector('.friend-info > .friend-fullname');
            
            // Display friend's full name in chat box (message recipient name bar)
            let recipientNameBar = document.querySelector('#message-recipient-name-bar');
            recipientNameBar.innerHTML = friendFullName.innerHTML;
            if (recipientNameBar.querySelector('span')) {
                recipientNameBar.querySelector('span').remove();
            }
            recipientNameBar.setAttribute('data-friend-id', friendID);

            // Highlight active friend tab and add medium shadow
            let tempFriendsNavTab = document.querySelector('#friends-nav-tab');
            for (let friendTab of tempFriendsNavTab.children) {
                friendTab.className = friendTab.className.replace(' active', ' inactive');
                friendTab.className = friendTab.className.replace('shadow-md', '');
            }
            event.currentTarget.className = event.currentTarget.className.replace(' inactive', ' active');
            event.currentTarget.classList.add('shadow-md');

            // Remove new message notification (blue dot) and make text become gray
            let messageSnippet = friendTab.querySelector('.friend-info > .message-snippet');
            if (friendTab.querySelector('.notification-dot')) {
                messageSnippet.classList.remove('font-semibold');
                messageSnippet.classList.add('text-gray-400', 'font-normal');
                friendTab.querySelector('.notification-dot').remove();
            }

            // If messages data found in sessionStorage, then load them into chat messages box
            if (sessionStorage.hasOwnProperty(`friend${friendID}`)) {
                console.log('getting messages from sessionStorage');
                const messages = JSON.parse(sessionStorage.getItem(`friend${friendID}`));
                renderMessagesBox(friendsNavTab, messages);
            } 

            // Initial fetching messages between users, then store them in sessionStorage and display them in chat message box
            else {
                const dateNow = new Date(Date.now());
                const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

                const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=20`;
                const resultOption = `resultMessageID=true&resultCreatorID=true&resultRecipientID=true&resultMessageText=true&resultFilePath=true&resultFileType=true&resultCreateDate=true&resultIsRead=true`;
                const queryString = `${searchOption}&${resultOption}`;

                await fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/messages/option?${queryString}`)
                    .then(response => response.json())
                    .then(data => {
                        /*
                            Array of messages ordered by descending create date
                            messages[0]          --> Lastest
                            messages[length - 1] --> Oldest
                        */
                        const messages = data.messages;
                        
                        // Messages response data are found
                        if (messages && messages.length > 0) {
                            renderMessagesBox(friendsNavTab, messages);

                            // Store newly fetched messages in sessionStorage if there's free space
                            sessionStorage.setItem(`friend${friendID}`, JSON.stringify(messages));
                        } 
                        
                        // No messages response data found
                        else {
                            chatMsgBox.innerHTML = '';
                        }
                    })
            }

            // Send seen message(s) status to server
            const recipientID = messageSnippet.getAttribute('data-message-recipient-id');
            const creatorID = messageSnippet.getAttribute('data-message-creator-id');
            if (userID == recipientID) {
                let messageIDs = [];
                for (let message of chatMsgBox.children) {
                    if (message.getAttribute('data-message-is-read') == 'false') {
                        messageIDs.push(Number.parseInt(message.getAttribute('data-message-id')));
                    }
                }

                if (messageIDs.length > 0) {
                    messageData.senderID = creatorID;
                    messageData.recipientID = userID;
                    messageData.messageID = messageIDs.filter(Boolean);
                    messageData.isRead = true;

                    socket.emit('seen message', messageData);
                }
            }

            // Avoid too much scrolling effect causing dizziness
            chatMsgBox.style['scroll-behavior'] = null;
            setTimeout(() => {
                // Automatically scroll down to last child view (bottom of messages box)
                if (chatMsgBox.childElementCount > 0) {
                    chatMsgBox.children[chatMsgBox.childElementCount - 1].scrollIntoView();
                }
            }, 30);
        }
    }

    // Automatically click on friend tab when clicking new message notification on friend-list page
    setTimeout(() => {
        let paramsString = location.href;
        let hrefParams = new URL(paramsString);

        const notification = hrefParams.searchParams.get('notification');
        const senderID = hrefParams.searchParams.get('senderID');
        if (notification == 'true' && friendsNavTab[senderID]) {
            let friendTab = friendsNavTab[senderID];
            friendTab.click();

            // Change URL with params to '/home' without refreshing page
            window.history.pushState('new state', 'Chat', '/home');
        }
    }, 30);
}






// Send current session user info when socket is connected
socket.on('connected', () => {
    const userFullName = userInfo.innerHTML.trim();
    const userAvatarSrc = document.querySelector('#user-avatar').getAttribute('src');
    messageData.senderID = Number.parseInt(userID);

    let userData = {
        userID: userID,
        userFullName: userFullName,
        userAvatarSrc: userAvatarSrc,
        userSocketID: socket.id
    };

    socket.emit('user info', userData);
});


// Receive broadcasted message from server when a new user is connected
socket.on('active users', (activeUsers) => {
    console.log('Active users:', activeUsers);

    // Waiting for other elements to be fully rendered
    setTimeout(() => {
        let friendsNavTab = document.querySelector('#friends-nav-tab');
        for (let friendTab of friendsNavTab.children) {
            let friendID = friendTab.getAttribute('data-friend-id');
            if (activeUsers[friendID]) {
                let friendFullname = friendTab.querySelector('.friend-info > .friend-fullname');
                if (!friendFullname.innerHTML.includes('online')) {
                    friendFullname.innerHTML += '<span class="text-red-600"> - online</span>';
                }
            }
        }
    }, 100);
});


// Fetch 20 old messages when scroll to top of chat box
chatMsgBox.onscroll = async () => {
    if (chatMsgBox.scrollTop == 0) {
        // Add loading animation element when scrolling to top to get old messages
        if (!chatMsgBox.querySelector('#loading-animation')) {
            chatMsgBox.prepend(loadingAnimationDiv);
        }

        const dateNow = new Date(Date.now());
        const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;
        const friendID = document.querySelector('#message-recipient-name-bar').getAttribute('data-friend-id');

        const offset = messagesCount[friendID].offset + 20;
        const limit = messagesCount[friendID].limit;

        const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchOffset=${offset}&searchLimit=${limit}`;
        const resultOption = `resultMessageID=true&resultCreatorID=true&resultRecipientID=true&resultMessageText=true&resultFilePath=true&resultFileType=true&resultCreateDate=true&resultIsRead=true`;
        const queryString = `${searchOption}&${resultOption}`;

        await fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/messages/option?${queryString}`)
        .then(response => response.json())
        .then(data => {
            // Remove loading animation element when old messages are fully fetched
            if (chatMsgBox.querySelector('#loading-animation')) {
                chatMsgBox.querySelector('#loading-animation').remove();
            }

            const oldMessages = data.messages;
            console.log(oldMessages);

            if (oldMessages && oldMessages.length > 0) {
                messagesCount[friendID].offset += 20;

                for (let message of oldMessages) {
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

                    let imgSrc = '';
                    if (message.filePath) {
                        imgSrc = message.filePath;
                    }

                    chatMsgBox.innerHTML = renderMessage(message.messageID, messageCreator, creatorAvatar, message.messageText, imgSrc, message.createDate, message.isRead) + chatMsgBox.innerHTML;
                }

                // Store fetched messages to sessionStorage
                addMessageToSessionStorage(oldMessages, friendID);
            }
        });
    }
}


// Send message to other user
form.onsubmit = (event) => {
    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');

    if (friendID) {
        messageData.senderID = userID;
        messageData.messageID = null;
        messageData.isRead = null;

        // Add backslash in front of each special character
        messageTextInput.value = messageTextInput.value.trim();
        let tempMessageText = messageTextInput.value.split('');
        tempMessageText = tempMessageText.map((word) => {
            if (word.match(/[\W]/g) && !word.match(/[\s]/g)) {
                return '\\' + word;
            } else {
                return word;
            }
        })

        // DD-MM-YYYY HH24:MM:SS
        const dateNow = new Date(Date.now());
        const date = dateNow.getDate() >= 10 ? dateNow.getDate() : ('0' + dateNow.getDate());
        const month = dateNow.getMonth() >= 10 ? (dateNow.getMonth() + 1) : ('0' + (dateNow.getMonth() + 1));
        const year = dateNow.getFullYear();
        const now = `${date}-${month}-${year} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

        messageData.createDate = now;

        // Handling only text transfering
        if (messageFileInput.files.length == 0 && messageTextInput.value.length > 0 && messageTextInput.value.length < (5 * 10**5)) {
            messageData.messageText = tempMessageText.join('').trim();
            messageData.recipientID = Number.parseInt(friendID);

            socket.emit('message', messageData);
            messageTextInput.value = '';

            // Play sending message sound
            const sentMsgAudio = new Audio('/audio/send-message-sound.mp3');
            sentMsgAudio.play();
        }
        
        // Handling file transfering (images) with messageText (optional)
        if (messageFileInput.files.length > 0) {
            // Add messageText if found
            if (tempMessageText) {
                messageData.messageText = tempMessageText.join('').trim();
            }

            for (let file of messageFileInput.files) {
                // Send whole array buffer if file size < 500KB
                if (file.size < 500000 && file.type.includes('image')) {
                    let fileReader = new FileReader();

                    fileReader.onload = (event) => {
                        messageData.file = new Uint8Array(event.target.result);
                        messageData.fileType = file.type;

                        messageData.recipientID = Number.parseInt(friendID);
                        socket.emit('message', messageData);

                        // Delete mesageText after sending first file with mesageText
                        if (messageData.messageText) {
                            messageData.messageText = null;
                        }
                    }

                    fileReader.readAsArrayBuffer(file);
                }

                // Send separate array buffer chunks if file size is >= 500KB
                if (file.size >= 500000 && file.type.includes('image')) {
                    let fileReader = new FileReader();

                    fileReader.onload = (event) => {
                        let fileChunks = new Uint8Array(event.target.result);

                        messageData.recipientID = Number.parseInt(friendID);
                        messageData.startChunk = 0;
                        messageData.endChunk = 300000;
                        messageData.fileSize = fileChunks.byteLength;
                        messageData.file = fileChunks.slice(messageData.startChunk, messageData.endChunk);
                        messageData.fileType = file.type;

                        socket.emit('start chunk', messageData, (messageID) => {
                            // Receive a messageID when initialize first chunk of whole file
                            tempFileChunks[messageID] = fileChunks;
                        });

                        // Delete mesageText after sending first file with mesageText
                        if (messageData.messageText) {
                            messageData.messageText = null;
                        }

                        // Display file transfering status
                        if (!document.querySelector('#message-status')) {
                            messageStatus.innerHTML = '<br><br>??ang g???i . . .';
                            chatMsgBox.appendChild(messageStatus);
                        } else {
                            document.querySelector('#message-status').remove();
                            messageStatus.innerHTML = '<br><br>??ang g???i . . .';
                            chatMsgBox.appendChild(messageStatus);
                        }

                        chatMsgBox.scrollTop = chatMsgBox.scrollHeight;
                    }

                    fileReader.readAsArrayBuffer(file);
                }
            }

            // Remove image previewing and empty message text input when done load-start
            if (document.querySelector('#cancel-files-preview')) {
                document.querySelector('#cancel-files-preview').click();
                messageTextInput.value = '';
            }

            // Play sending message sound
            const sentMsgAudio = new Audio('/audio/send-message-sound.mp3');
            sentMsgAudio.play();
        }
    }

    event.preventDefault();
}


// Handling file chunk request from server
socket.on('request next chunk', (messageData) => {
    // Get the correct whole file
    const messageID = messageData.messageID;
    const fileChunks = tempFileChunks[messageID];

    if (fileChunks) {
        let start = messageData.startChunk + 300000;
        let end = messageData.endChunk + 300000;
        const fileSize = messageData.fileSize;

        if (start >= fileSize || end >= fileSize) {
            if (start >= fileSize) {
                start = fileSize;
                end = fileSize;

                messageData.startChunk = fileSize;
                messageData.endChunk = fileSize;
            }

            if (end >= fileSize) {
                start = messageData.endChunk;
                end = fileSize;

                messageData.startChunk = messageData.endChunk;
                messageData.endChunk = fileSize;
            }

            messageData.file = fileChunks.slice(start, end);
            socket.emit('end chunk', messageData);
        } else {
            messageData.file = fileChunks.slice(start, end);
            messageData.startChunk = messageData.startChunk + 300000;
            messageData.endChunk = messageData.startChunk + 300000;
            socket.emit('next chunk', messageData);
        }
    }
})


// Image(s) previewing
messageFileInput.onchange = previewFiles;


// Hide away image(s) previewing and remove file(s) input
let cancelFilesPreview = document.querySelector('#cancel-files-preview');
cancelFilesPreview.onclick = () => {
    filesPreview.innerHTML = '';
    if (!filesPreviewWrapper.classList.contains('hidden')) {
        filesPreviewWrapper.classList.add('hidden');
        messageFileInput.value = null;
    }
}


// Receive a message from a user
socket.on('message', (messageData) => {
    console.log('New incoming message:', messageData);

    // Remove typing feedback
    let typingFeedback = document.querySelector('#typing-feedback');
    if (typingFeedback) {
        typingFeedback.remove();
    }

    // Determine whose message
    let msgCreator = '';
    if (messageData.senderID != userID) {
        msgCreator = 'friend-message';

        const receiveMsgAudio = new Audio('/audio/receive-message-sound.mp3');
        receiveMsgAudio.play();
    } else {
        msgCreator = 'my-message';
    }

    const messageID = messageData.messageID;
    const creatorID = messageData.senderID;
    const messageRecipientID = messageData.recipientID;
    const messageText = messageData.messageText;
    const messageCreateDate = messageData.createDate;
    const messageFilePath = messageData.file;
    const messageFileType = messageData.fileType;

    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendIdBar = recipientNameBar.getAttribute('data-friend-id');

    // Message coming straight into message box
    if (messageData.senderID == friendIdBar || messageData.senderID == userID) {
        // Get avatar of message creator
        let friendAvatarSrc;
        let friendTab = friendsNavTab[messageData.senderID];
        if (friendTab) {
            friendAvatarSrc = friendTab.querySelector('div > img').getAttribute('src');
        } else {
            friendAvatarSrc = null;
            friendTab = friendsNavTab[messageData.recipientID];
        }

        // Get image source if found
        let imgSrc = null;
        if (messageData.file && messageData.fileType) {
            imgSrc = messageData.file;
        }

        // Render incoming message
        chatMsgBox.innerHTML += renderMessage(messageID, msgCreator, friendAvatarSrc, messageText, imgSrc, messageCreateDate, true);

        // Update message snippet
        const message = {
            messageID: messageID,
            creatorID: creatorID,
            recipientID: messageRecipientID,
            messageText: messageText,
            filePath: messageFilePath,
            fileType: messageFileType,
            createDate: messageCreateDate,
            isRead: true
        }
        renderMessageSnippet(friendTab, message);

        // Send seen message data if message's senderID == friendID
        if (messageData.senderID == friendIdBar) {
            socket.emit('seen message', messageData);
            messageData.isRead = true;
        }

        // Automatically move to the bottom of chat box
        chatMsgBox.style['scroll-behavior'] = 'smooth';
        chatMsgBox.scrollTop = chatMsgBox.scrollHeight;
    } 
    
    // Show new message at friends navigation tab (with blue notification dot)
    else {
        let friendTab = friendsNavTab[messageData.senderID];
        if (friendTab) {
            const newMsgAudio = new Audio('/audio/new-message-notification.mp3');
            newMsgAudio.play();

            const message = {
                messageID: messageID,
                creatorID: creatorID,
                recipientID: messageRecipientID,
                messageText: messageText,
                filePath: messageFilePath,
                fileType: messageFileType,
                createDate: messageCreateDate,
                isRead: false
            }
            renderMessageSnippet(friendTab, message);
            messageData.isRead = false;
        }
    }

    // Show sent/seen message status
    if (messageData.senderID == userID) {
        messageStatus.innerHTML = '???? g???i';
        if (!chatMsgBox.querySelector('#message-status')) {
            chatMsgBox.appendChild(messageStatus);
        } else {
            chatMsgBox.querySelector('#message-status').remove();
            chatMsgBox.appendChild(messageStatus);
        }
    } else if (messageData.senderID != userID) {
        if (chatMsgBox.querySelector('#message-status')) {
            chatMsgBox.querySelector('#message-status').remove();
        }
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


// Friend seen my message
socket.on('seen message', (messageData) => {
    const senderID = messageData.senderID;
    console.log('friend seen my message');
    console.log(messageData);
    
    let friendID;
    if (senderID == userID) {
        friendID = messageData.recipientID;
    } else {
        friendID = messageData.senderID;
    }

    // Update message status (message.isRead) in sessionStorage
    if (sessionStorage.hasOwnProperty(`friend${friendID}`)) {
        let messages = sessionStorage.getItem(`friend${friendID}`);
        messages = JSON.parse(messages);

        let lastestMessageID;
        if (Array.isArray(messageData.messageID)) {
            lastestMessageID = Math.max(...messageData.messageID);
        }

        if (Number.parseInt(messageData.messageID) && !Array.isArray(messageData.messageID)) {
            lastestMessageID = Number.parseInt(messageData.messageID);
        }

        for (let message of messages) {
            if (lastestMessageID >= message.messageID && !message.isRead) {
                message.isRead = true;
            }
        }

        sessionStorage.setItem(`friend${friendID}`, JSON.stringify(messages));
    }

    if (document.querySelector('#message-status') && senderID == userID) {
        document.querySelector('#message-status').innerHTML = '???? xem';
    }
});


// Emit typing event when user is typing
messageTextInput.onkeydown = (event) => {
    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');

    if (friendID && event.key !== 'Enter' && event.key !== 'Backspace') {
        messageData.senderID = userID;
        messageData.recipientID = friendID;
        socket.emit('typing', messageData);
    }

    if (event.key === 'Escape') {
        messageTextInput.value = '';
        event.currentTarget.blur();
        socket.emit('stopped typing', messageData);
    }
}


// Emit stopped typing event when user stops
messageTextInput.onkeyup = () => {
    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');

    if (messageTextInput.value.length == 0 && friendID) {
        messageData.recipientID = friendID;
        socket.emit('stopped typing', messageData);
    }
}


// Listen to typing event from other user
socket.on('typing', (messageData) => {
    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');
    
    if (!document.querySelector('#typing-feedback') && messageData.senderID == friendID) {
        const avatarSrc = friendsNavTab[friendID].querySelector('div > img').getAttribute('src');
        let avatar = typingFeedback.querySelector('img');
        avatar.setAttribute('src', avatarSrc);
        avatar.setAttribute('class', 'self-start mr-2 w-7 h-7 shadow-md rounded-full'); 

        chatMsgBox.style['scroll-behavior'] = 'smooth';
        chatMsgBox.appendChild(typingFeedback);
        document.querySelector('#typing-feedback').scrollIntoView();
    }
});


// Listen to stopped typing event from other user
socket.on('stopped typing', () => {
    let typingFeedback = document.querySelector('#typing-feedback');
    if (typingFeedback) {
        typingFeedback.remove();
    }    
});


// Receive user data when a user is disconnected
socket.on('user disconnection', (socketData) => {
    console.log('user disconnection:', socketData);

    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');

    // Remove typing feedback
    if (socketData.userID == friendID) {
        let typingFeedback = document.querySelector('#typing-feedback');
        if (typingFeedback) {
            typingFeedback.remove();
        }
    }

    // Remove online status of a friend
    let friendTab = friendsNavTab[socketData.userID];
    if (friendTab) {
        let friendFullname = friendTab.querySelector('.friend-info > .friend-fullname');
        if (friendFullname.innerHTML.includes('online')) {
            let onlineSpan = friendFullname.querySelector('span');
            onlineSpan.remove();
        }
    }
});