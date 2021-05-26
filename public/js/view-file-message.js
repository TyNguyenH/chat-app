import CONFIG from './config.js';




class FileMessageList {
    /*
        {array}  this.fileMessages              - containing all file messages 
                [latest file message, ..., oldest file message]

        {number} this.activeFileMessageIndex    - this helps knowing which file message is being viewed (active status)

        {object} this.fetchConfig {
            offset  {number}
            limit   {number}
        }

        {number} this.currentFriendID           - this helps knowing which conversation the user is currently in
    */

    constructor(fileMessages) {
        // Init fetching old messages config
        this.fetchConfig = {
            offset: 0,
            limit: 10
        }

        // Init currentFriendID
        this.currentFriendID = null;

        if (fileMessages === undefined) {
            // Init fileMessages
            this.fileMessages = []

            // Init activeFileMessageIndex
            this.activeFileMessageIndex = null;
        }
        
        if (fileMessages) {
            // Init fileMessages
            this.fileMessages = Array.from(fileMessages);

            // Init activeFileMessageIndex
            for (let fileMessageObject of fileMessages) {
                if (fileMessageObject.isActive) {
                    this.activeFileMessageIndex = fileMessages.indexOf(fileMessageObject);
                    break;
                }
            }
        }
    }

    // Add array of fileMessageObjects to fileMessageQueue
    addFileMessageObjectArray(fileMessageObjectArray) {
        if (Array.isArray(fileMessageObjectArray)) {
            const fileMessagesArray1 = fileMessageObjectArray;
            const fileMessagesArray2 = this.fileMessages;

            const array1Len = fileMessagesArray1.length;
            const array2Len = fileMessagesArray2.length;

            let arrayResult = [];
            let index1 = 0;
            let index2 = 0;

            while (index1 < array1Len || index2 < array2Len) {
                if ((fileMessagesArray1[index1] == fileMessagesArray2[index2]) && fileMessagesArray1[index1].messageID == fileMessagesArray2[index2].messageID) {
                    arrayResult.push(fileMessagesArray1[index1]);

                    index1 += 1;
                    index2 += 1;
                }

                if ((fileMessagesArray1[index1] && fileMessagesArray2[index2]) && fileMessagesArray1[index1].messageID > fileMessagesArray2[index2].messageID) {
                    arrayResult.push(fileMessagesArray1[index1]);
                    index1 += 1;
                }

                if ((fileMessagesArray1[index1] && fileMessagesArray2[index2]) && fileMessagesArray1[index1].messageID < fileMessagesArray2[index2].messageID) {
                    arrayResult.push(fileMessagesArray2[index2]);
                    index2 += 1;
                }


                if (index1 == array1Len && index2 < array2Len) {
                    while (index2 < array2Len) {
                        arrayResult.push(fileMessagesArray2[index2]);
                        index2 += 1;
                    }
                }

                if (index2 == array2Len && index1 < array1Len) {
                    while (index1 < array1Len) {
                        arrayResult.push(fileMessagesArray1[index1]);
                        index1 += 1;
                    }
                }
            }

            this.fileMessages = Array.from(arrayResult);
        }
    }

    // Move to next file message (the smaller the index, the latest the file message)
    moveNextFile() {
        if (this.activeFileMessageIndex - 1 >= 0) {
            this.fileMessages[this.activeFileMessageIndex].isActive = false;
            this.fileMessages[this.activeFileMessageIndex - 1].isActive = true;

            this.activeFileMessageIndex -= 1;
        }
    }

    // Move to previous file message (the higher the index, the older the file message)
    moveBackFile() {
        if (this.activeFileMessageIndex + 1 < this.fileMessages.length) {
            this.fileMessages[this.activeFileMessageIndex].isActive = false;
            this.fileMessages[this.activeFileMessageIndex + 1].isActive = true;

            this.activeFileMessageIndex += 1;


            // Fetch old file messages and add them to FileMessageList
            if (this.activeFileMessageIndex + 1 == this.fileMessages.length) {
                const dateNow = new Date(Date.now());
                const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

                const userID = document.querySelector('#user-info').getAttribute('data-user-id');
                const friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');

                const limit = this.fetchConfig.limit;
                const offset = this.fetchConfig.offset + 10;

                const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchOffset=${offset}&searchLimit=${limit}`;

                fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/file-messages/option?${searchOption}`)
                    .then(res => res.json())
                    .then(data => {
                        let fileMessages = data.fileMessages;
                        if (fileMessages.length > 0) {
                            this.addFileMessageObjectArray(fileMessages);
                            this.renderFileMessageList();

                            this.fetchConfig.offset += 10;
                        }
                    })
            }
        }
    }

    // Move to a specific file message index
    moveToFile(index) {
        index = Number.parseInt(index);

        if (index >= 0 && index < this.fileMessages.length) {
            this.fileMessages[this.activeFileMessageIndex].isActive = false;
            this.fileMessages[index].isActive = true;

            this.activeFileMessageIndex = index;


            // Fetch old file messages and add them to FileMessageList
            if (this.activeFileMessageIndex == (this.fileMessages.length - 1)) {
                const dateNow = new Date(Date.now());
                const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

                const userID = document.querySelector('#user-info').getAttribute('data-user-id');
                const friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');

                const limit = this.fetchConfig.limit;
                const offset = this.fetchConfig.offset + 10;

                const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchOffset=${offset}&searchLimit=${limit}`;

                fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/file-messages/option?${searchOption}`)
                    .then(res => res.json())
                    .then(data => {
                        let fileMessages = data.fileMessages;
                        if (fileMessages.length > 0) {
                            this.addFileMessageObjectArray(fileMessages);
                            this.renderFileMessageList();

                            this.fetchConfig.offset += 10;
                        }
                    })
            }
        }
    }

    // Update active status of fileMessageObjects based on currentViewingImage
    updateFileMessageList() {
        this.fileMessages = this.fileMessages.map((fileMessageObject) => {
            fileMessageObject.isActive = false;
            return fileMessageObject;
        })

        // Set active status for file message that is being viewed
        const currentViewingImage = document.querySelector('#file-message-viewer > img');
        for (let fileMessageObject of this.fileMessages) {
            if (currentViewingImage.getAttribute('src') === fileMessageObject.filePath) {
                fileMessageObject.isActive = true;
                this.activeFileMessageIndex = this.fileMessages.indexOf(fileMessageObject);

                break;
            }
        }
    }

    renderFileMessageList() {
        let fileMessageListElement = document.querySelector('#file-message-list');
        fileMessageListElement.innerHTML = '';

        for (let fileMessageObject of this.fileMessages) {
            let fileMessageDiv = document.createElement('div');

            let styleOpacity = 'opacity-50';
            if (fileMessageObject.isActive) {
                styleOpacity = 'opacity-100';
            }

            fileMessageDiv.setAttribute('data-file-message-index', this.fileMessages.indexOf(fileMessageObject));
            fileMessageDiv.setAttribute('class', `flex-shrink-0 cursor-pointer rounded-lg ${styleOpacity} hover:opacity-100 h-16 w-16 mx-2`);

            fileMessageDiv.onclick = (event) => {
                const fileMessageIndex = event.currentTarget.getAttribute('data-file-message-index');
                fileMessageList.moveToFile(Number.parseInt(fileMessageIndex));
                fileMessageList.renderFileMessageList()
            }

            fileMessageDiv.innerHTML = `
                <img src='${fileMessageObject.filePath}' class="rounded-lg h-16 w-16 object-cover">
            `;

            fileMessageListElement.prepend(fileMessageDiv);
        }

        let currentViewingImage = document.querySelector('#file-message-viewer > img');
        currentViewingImage.setAttribute('src', this.fileMessages[this.activeFileMessageIndex].filePath);
    }

    resetFileMessages() {
        this.fetchConfig.offset = 0;
        this.fileMessages = [];
    }

    getCurrentFriendID() {
        return this.currentFriendID;
    }

    getFileMessages() {
        return Array.from(this.fileMessages);
    }
}

let fileMessageList = new FileMessageList();






let fileMessageViewerWrapper = document.querySelector('#file-message-viewer-wrapper');

// Fetch file messages when focusing file-message-viewer-wrapper
fileMessageViewerWrapper.onfocus = () => {
    const dateNow = new Date(Date.now());
    const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

    const userID = document.querySelector('#user-info').getAttribute('data-user-id');
    const friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');

    const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=10`;

    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/file-messages/option?${searchOption}`)
        .then(res => res.json())
        .then(data => {
            let fileMessages = data.fileMessages;
            if (fileMessages.length > 0) {
                fileMessages = fileMessages.map((fileMessageObject) => {
                    fileMessageObject.isActive = false;
                    return fileMessageObject;
                });
                
                // This helps knowing which friend the user is talking to
                let friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');
                friendID = Number.parseInt(friendID);
                
                // Reset fileMessageList if the user moves to a different conversation
                if (!fileMessageList.getCurrentFriendID() || fileMessageList.getCurrentFriendID() !== friendID) {
                    fileMessageList.currentFriendID = friendID;

                    fileMessageList.resetFileMessages();
                    fileMessageList.addFileMessageObjectArray(fileMessages);
                    fileMessageList.updateFileMessageList();
                }

                // Update fileMessageList if the user is still in the same conversation
                else if (fileMessageList.getCurrentFriendID() === friendID) {
                    let currentViewingImage = document.querySelector('#file-message-viewer > img');
                    const fileMessageListElement = document.querySelector('#file-message-list');

                    // Update fileMessageList
                    for (let fileMessageDiv of fileMessageListElement.children) {
                        if (fileMessageDiv.querySelector('img').getAttribute('src') === currentViewingImage.getAttribute('src')) {
                            let index = fileMessageDiv.getAttribute('data-file-message-index');
                            index = Number.parseInt(index);

                            fileMessageList.moveToFile(index);
                        }
                    }
                }
            }

            // Render file message list (below file message viewer)
            fileMessageList.renderFileMessageList();
            console.log(fileMessageList.getFileMessages());
        })
}

// Move to next or previous file message when pressing left or right key
fileMessageViewerWrapper.onkeydown = (event) => {
    if (event.key === 'ArrowLeft') {
        fileMessageList.moveBackFile();
    }

    if (event.key === 'ArrowRight') {
        fileMessageList.moveNextFile();
    }

    if (event.key === 'Escape') {
        if (!fileMessageViewerWrapper.classList.contains('hidden')) {
            fileMessageViewerWrapper.classList.add('hidden');
        }
    }

    fileMessageList.renderFileMessageList();
}


let nextButton = document.querySelector('#next-btn');
nextButton.onclick = () => {
    fileMessageList.moveNextFile();
    fileMessageList.renderFileMessageList();
}


let backButton = document.querySelector('#back-btn');
backButton.onclick = () => {
    fileMessageList.moveBackFile();
    fileMessageList.renderFileMessageList();
}


let fileMessageQuitButton = document.querySelector('#quit-btn');
fileMessageQuitButton.onclick = () => {
    if (!fileMessageViewerWrapper.classList.contains('hidden')) {
        fileMessageViewerWrapper.classList.add('hidden');
    }
}


// Enable horizontal scrolling
let fileMessageListElement = document.querySelector('#file-message-list');
fileMessageListElement.onwheel = (event) => {
    event = window.event || event;
    let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    document.getElementById('file-message-list').scrollLeft -= (delta * 40); // Multiplied by 40

    event.preventDefault();
}