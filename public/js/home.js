import CONFIG from './config.js';
import { renderFriendsNavTab, renderMessageSnippet, renderAllMessageSnippets, renderMessage, renderMessagesBox } from './home-functions.js';


let socket = io();
socket.connect(`${CONFIG.serverAddress}:${CONFIG.serverPort}`, { secure: true });

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

/*
    This object is used for fetching old messages and merging them into new ones
    messageCount = {
        friendID: {
            offset:     {number}
            limit:      {number}
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
chatMsgBox.style['scroll-behavior'] = 'smooth';

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

const userInfo = document.querySelector('#user-info');
const userID = userInfo.getAttribute('data-user-id');






window.onload = async () => {
    // Clear localStorage when loading or refreshing home page
    localStorage.clear();

    await renderFriendsNavTab();

    // Assign values to global "friendsNavTab" object
    let tempFriendsNavTab = document.querySelector('#friends-nav-tab');
    for (let friendTab of tempFriendsNavTab.children) {
        const friendID = friendTab.getAttribute('data-friend-id');
        friendsNavTab[friendID] = friendTab;
    }

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

            // Highlight active friend tab
            let tempFriendsNavTab = document.querySelector('#friends-nav-tab');
            for (let friendTab of tempFriendsNavTab.children) {
                friendTab.className = friendTab.className.replace(' active', ' inactive');
            }
            event.currentTarget.className = event.currentTarget.className.replace(' inactive', ' active');

            // Remove new message notification (blue dot)
            let messageSnippet = friendTab.querySelector('.friend-info > .message-snippet');
            if (friendTab.querySelector('.notification-dot')) {
                messageSnippet.classList.remove('font-semibold');
                messageSnippet.classList.add('text-gray-400', 'font-normal');
                friendTab.querySelector('.notification-dot').remove();
            }

            // If messages data found in localStorage, then load them into chat messages box
            if (localStorage.hasOwnProperty(`friend${friendID}`)) {
                const messages = JSON.parse(localStorage.getItem(`friend${friendID}`));
                renderMessagesBox(friendsNavTab, messages);
            } 

            // Initial fetching messages between users, store them in localStorage and display them in chat message box
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
                        if (messages.length > 0) {
                            renderMessagesBox(friendsNavTab, messages);

                            // Store newly fetched messages in localStorage if there's free space
                            navigator.storage.estimate()
                                .then(data => {
                                    if (data.usage < data.quota) {
                                        localStorage.setItem(`friend${friendID}`, JSON.stringify(messages));
                                    }
                                })
                        } 
                        
                        // No messages response data found
                        else {
                            chatMsgBox.innerHTML = '';
                        }
                    })
            }

            // Automatically scroll down to bottom
            chatMsgBox.scrollTop = chatMsgBox.scrollHeight;

            // Send seen message(s) status to server
            const recipientID = messageSnippet.getAttribute('data-message-recipient-id');
            const creatorID = messageSnippet.getAttribute('data-message-creator-id');
            if (userID == recipientID) {
                let messageIDs = [];
                for (let message of chatMsgBox.children) {
                    messageIDs.push(Number.parseInt(message.getAttribute('data-message-id')));
                }
                messageData.senderID = creatorID;
                messageData.recipientID = userID;
                messageData.messageID = messageIDs.filter(Boolean);
                messageData.isRead = true;

                socket.emit('seen message', messageData);
            }
        }
    }
}






// Send current session user info when socket is connected
socket.on('connected', () => {
    messageData.senderID = Number.parseInt(userID);

    let userData = {
        userID: userID,
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
            const messages = data.messages;
            console.log(messages);

            if (messages.length > 0) {
                messagesCount[friendID].offset += 20;

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

                let newMessages = JSON.stringify(messages).replace(/[\[\]]/g, '');

                navigator.storage.estimate()
                .then(data => {
                    const quota = data.quota;
                    const usage = data.usage;

                    if (usage < quota && localStorage.hasOwnProperty(`friend${friendID}`)) {
                        let currentMessages = localStorage.getItem(`friend${friendID}`);
                        currentMessages = currentMessages.replace(']', '');
                        currentMessages = currentMessages + ',' + newMessages + ']';
                        localStorage.setItem(`friend${friendID}`, currentMessages);
                    }
                })
            }
        });

        console.log(messagesCount);
    }
}


// Send message to other user
form.onsubmit = (event) => {
    const recipientNameBar = document.querySelector('#message-recipient-name-bar');
    const friendID = recipientNameBar.getAttribute('data-friend-id');
    if (friendID && messageTextInput.value.length > 0 && messageTextInput.value.length < 2**28) {
        const dateNow = new Date(Date.now());
        const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

        messageData.messageID = null;
        messageData.isRead = null;
        messageData.recipientID = Number.parseInt(friendID);
        let tempMessageText = messageTextInput.value.split('');
        tempMessageText = tempMessageText.map((word) => {
            if (word.match(/[\W]/g) && !word.match(/[\s]/g)) {
                return '\\' + word;
            } else {
                return word;
            }
        })

        messageData.messageText = tempMessageText.join('').trim();
        messageData.createDate = now;

        socket.emit('message', messageData);
        messageTextInput.value = '';

        const sentMsgAudio = new Audio('/audio/send-message-sound.mp3');
        sentMsgAudio.play();
    }

    event.preventDefault();
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

        // Render incoming message
        chatMsgBox.innerHTML += renderMessage(messageID, msgCreator, friendAvatarSrc, messageText, null, messageCreateDate);

        // Update message snippet
        const message = {
            messageID: messageID,
            creatorID: creatorID,
            recipientID: messageRecipientID,
            messageText: messageText,
            isRead: true
        }
        renderMessageSnippet(friendTab, message);

        // Send seen message data if message's senderID is equal to friendID
        if (messageData.senderID == friendIdBar) {
            socket.emit('seen message', messageData);
            messageData.isRead = true;
        }

        // Automatically move to the bottom of chat box
        setTimeout(() => {
            chatMsgBox.scrollTop = chatMsgBox.scrollHeight;
        }, 100);
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
                isRead: false
            }
            renderMessageSnippet(friendTab, message);
            messageData.isRead = false;
        }
    }

    // Show sent/seen message status
    if (messageData.senderID == userID) {
        messageStatus.innerHTML = 'Đã gửi';
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

    // Store new message to localStorage
    navigator.storage.estimate()
        .then(data => {
            const newMessage = {
                messageID: Number.parseInt(messageData.messageID),
                creatorID: Number.parseInt(messageData.senderID),
                recipientID: Number.parseInt(messageData.recipientID),
                recipientGroupID: Number.parseInt(messageData.recipientGroupID),
                messageText: messageData.messageText,
                filePath: messageData.filePath,
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
                let messages;

                // Add new message to the beginning of the messages array
                if (localStorage.hasOwnProperty(`friend${friendID}`)) {
                    messages = localStorage.getItem(`friend${friendID}`);
                    messages = messages.replace('[', '');
                    messages = '[' + JSON.stringify(newMessage) + ',' + messages;
                    localStorage.setItem(`friend${friendID}`, messages);
                }
                
                // Initialize a new array of messages
                if (!localStorage.hasOwnProperty(`friend${friendID}`)) {
                    (async () => {
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

                                messages = data.messages;
                            })

                        messages = JSON.stringify(messages);
                        localStorage.setItem(`friend${friendID}`, messages);
                    })()   
                }
            }
        })

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

    // Update message status (message.isRead) in localStorage
    if (localStorage.hasOwnProperty(`friend${friendID}`)) {
        let messages = localStorage.getItem(`friend${friendID}`);
        messages = JSON.parse(messages);

        let lastestMessageID;
        if (Array.isArray(messageData.messageID)) {
            lastestMessageID = Math.max(...messageData.messageID);
        }

        if (Number.parseInt(messageData.messageID) && !Array.isArray(messageData.messageID)) {
            lastestMessageID = Number.parseInt(messageData.messageID);
        }

        console.log(lastestMessageID);
        for (let message of messages) {
            if (lastestMessageID >= message.messageID && !message.isRead) {
                message.isRead = true;
            }
        }

        localStorage.setItem(`friend${friendID}`, JSON.stringify(messages));
    }

    if (document.querySelector('#message-status') && senderID == userID) {
        messageStatus.innerHTML = 'Đã xem';
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
        setTimeout(() => {
            chatMsgBox.scrollTop = chatMsgBox.scrollHeight;
        }, 100);

        const avatarSrc = friendsNavTab[friendID].querySelector('div > img').getAttribute('src');
        let avatar = typingFeedback.querySelector('img');
        avatar.setAttribute('src', avatarSrc);
        avatar.setAttribute('class', 'self-start mr-2 w-7 h-7 shadow-md rounded-full'); 

        chatMsgBox.appendChild(typingFeedback);
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
})