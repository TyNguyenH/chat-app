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
                // If 2 file messages have the same messageID, choose the one with isActive == true
                if ((fileMessagesArray1[index1] && fileMessagesArray2[index2]) && fileMessagesArray1[index1].messageID == fileMessagesArray2[index2].messageID) {
                    if (fileMessagesArray1[index1].isActive == true) {
                        arrayResult.push(fileMessagesArray1[index1]);
                    }

                    else if (fileMessagesArray2[index2].isActive == true) {
                        arrayResult.push(fileMessagesArray2[index2]);
                    }

                    else {
                        arrayResult.push(fileMessagesArray1[index1]);
                    }

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
    moveNextFile(step) {
        if (step === undefined) {
            step = 1
        }

        if (this.activeFileMessageIndex - step >= 0) {
            this.fileMessages[this.activeFileMessageIndex].isActive = false;
            this.fileMessages[this.activeFileMessageIndex - step].isActive = true;

            this.activeFileMessageIndex -= step;


            if (this.activeFileMessageIndex - step < 0) {
                const dateNow = new Date(Date.now());
                const now = `${dateNow.getDate()}-${dateNow.getMonth() + 1}-${dateNow.getFullYear()} ${dateNow.getHours()}:${dateNow.getMinutes()}:${dateNow.getSeconds()}`;

                const userID = document.querySelector('#user-info').getAttribute('data-user-id');
                const friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');

                const limit = this.fetchConfig.limit;
                const offset = 0;

                const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchOffset=${offset}&searchLimit=${limit}`;

                fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/file-messages/option?${searchOption}`)
                    .then(res => res.json())
                    .then(data => {
                        let fileMessages = data.fileMessages;

                        if (fileMessages.length > 0) {
                            this.addFileMessageObjectArray(fileMessages);
                        }

                        this.renderFileMessageList();
                    })
            }
        }
    }

    // Move to previous file message (the higher the index, the older the file message)
    moveBackFile(step) {
        if (step === undefined) {
            step = 1;
        }

        if (this.activeFileMessageIndex + step < this.fileMessages.length) {
            this.fileMessages[this.activeFileMessageIndex].isActive = false;
            this.fileMessages[this.activeFileMessageIndex + step].isActive = true;

            this.activeFileMessageIndex += step;


            // Fetch old file messages and add them to FileMessageList
            if (this.activeFileMessageIndex + step == this.fileMessages.length) {
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
                            this.fetchConfig.offset += 10;
                        }

                        this.renderFileMessageList();
                    })
            }
        }
    }

    // Move to a specific file message index
    moveToFile(step) {
        step = Number.parseInt(step);

        if (step >= 0 && step < this.fileMessages.length) {
            this.moveNextFile(step);
            this.renderFileMessageList();
        }

        if (step < 0) {
            this.moveBackFile(Math.abs(step));
            this.renderFileMessageList();
        }
    }

    // Update active status of fileMessageObjects based on currentViewingImage
    updateFileMessageList() {
        for (let fileMessageObject of this.fileMessages) {
            fileMessageObject.isActive = false;
        }

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
                let fileMessageIndex = event.currentTarget.getAttribute('data-file-message-index');
                fileMessageIndex = Number.parseInt(fileMessageIndex);

                const activeFileMessageIndex = fileMessageList.getActiveFileMessageIndex();

                // Move next
                if (fileMessageIndex < activeFileMessageIndex) {
                    fileMessageList.moveToFile(activeFileMessageIndex - fileMessageIndex);
                }

                // Move back
                if (fileMessageIndex > activeFileMessageIndex) {
                    fileMessageList.moveToFile((fileMessageIndex - activeFileMessageIndex) * (-1));
                }

                fileMessageList.renderFileMessageList();
            }

            fileMessageDiv.innerHTML = `
                <img src='${fileMessageObject.filePath}' class="rounded-lg h-16 w-16 object-cover">
            `;

            fileMessageListElement.prepend(fileMessageDiv);
        }

        if (this.fileMessages[this.activeFileMessageIndex]) {
            let currentViewingImage = document.querySelector('#file-message-viewer > img');
            currentViewingImage.setAttribute('src', this.fileMessages[this.activeFileMessageIndex].filePath);
        }
    }

    resetFileMessages() {
        this.fetchConfig.offset = 0;
        this.fileMessages = [];
        this.activeFileMessageIndex = null;
    }

    resetActiveFileMessageIndex() {
        this.activeFileMessageIndex = null;
    }

    setActiveFileMessageIndex(index) {
        this.activeFileMessageIndex = index;
    }

    setFetchConfig(offset, limit) {
        this.fetchConfig.offset = offset;
        this.fetchConfig.limit = limit;
    }

    getFetchConfig() {
        return this.fetchConfig;
    }

    getCurrentFriendID() {
        return this.currentFriendID;
    }

    getFileMessages() {
        return Array.from(this.fileMessages);
    }

    getActiveFileMessageIndex() {
        return this.activeFileMessageIndex;
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
                
                const activeFileMessageIndex = fileMessageList.getActiveFileMessageIndex();

                // This helps knowing which friend the user is talking to
                let friendID = document.querySelector('#file-message-viewer').getAttribute('data-friend-id');
                friendID = Number.parseInt(friendID);
                
                // Reset fileMessageList if the user moves to a different conversation or fileMessageList is empty
                if (!fileMessageList.getCurrentFriendID() || fileMessageList.getCurrentFriendID() !== friendID) {
                    fileMessageList.currentFriendID = friendID;

                    fileMessageList.resetFileMessages();
                    fileMessageList.addFileMessageObjectArray(fileMessages);
                    fileMessageList.updateFileMessageList();
                    fileMessageList.renderFileMessageList();
                }

                // Update and render fileMessageList if the user is still in the same conversation
                else if (fileMessageList.getCurrentFriendID() === friendID) {
                    let currentViewingImage = document.querySelector('#file-message-viewer > img');
                    const fileMessageListElement = document.querySelector('#file-message-list');
                    
                    // Update fileMessageList
                    for (let fileMessageDiv of fileMessageListElement.children) {
                        if (fileMessageDiv.querySelector('img').getAttribute('src') === currentViewingImage.getAttribute('src')) {
                            let fileMessageIndex = fileMessageDiv.getAttribute('data-file-message-index');
                            fileMessageIndex = Number.parseInt(fileMessageIndex);

                            // Move next
                            if (fileMessageIndex < activeFileMessageIndex) {
                                fileMessageList.moveToFile(activeFileMessageIndex - fileMessageIndex);
                            }

                            // Move back
                            if (fileMessageIndex > activeFileMessageIndex) {
                                fileMessageList.moveToFile((fileMessageIndex - activeFileMessageIndex) * (-1));
                            }
                        }
                    }
                }

                // If clicked file message is not in fileMessageList, then add newly fetched file messages and update fileMessageList based on current viewing image
                if (!fileMessageList.getActiveFileMessageIndex() || activeFileMessageIndex === fileMessageList.getActiveFileMessageIndex()) {
                    let currentViewingMessageID = document.querySelector('#file-message-viewer').getAttribute('data-message-id');
                    currentViewingMessageID = Number.parseInt(currentViewingMessageID);

                    let activeFileMessageIndex;
                    let activeFileMessageID;

                    // fileMessages in fileMessageList is empty
                    if (!fileMessageList.getActiveFileMessageIndex()) {
                        fileMessageList.addFileMessageObjectArray(fileMessages);
                        fileMessageList.setActiveFileMessageIndex(0);
                    }

                    activeFileMessageIndex = fileMessageList.getActiveFileMessageIndex();
                    activeFileMessageID = fileMessageList.getFileMessages()[activeFileMessageIndex].messageID;

                    let offset = 0;

                    // Fetch new file messages
                    if (currentViewingMessageID > activeFileMessageID) {
                        offset = 0;
                    }

                    // Fetch old file messages
                    if (currentViewingMessageID < activeFileMessageID) {
                        offset = fileMessageList.getFetchConfig().offset + 10;
                    }

                    const searchOption = `searchCreatorID=[${userID},${friendID}]&searchRecipientID=[${userID},${friendID}]&searchDateTo=${now}&searchLimit=10&searchOffset=${offset}`;
                    
                    fetch(`${CONFIG.serverAddress}:${CONFIG.serverPort}/api/file-messages/option?${searchOption}`)
                        .then(res => res.json())
                        .then(data => {
                            const fileMessages = data.fileMessages;
                            if (fileMessages.length > 0) {
                                fileMessageList.addFileMessageObjectArray(fileMessages);
                                fileMessageList.setFetchConfig(offset, 10);
                                                          
                                fileMessageList.updateFileMessageList();

                                fileMessageList.renderFileMessageList();
                            }
                        });
                }
            }
        })
}

// Move to next or previous file message when pressing left or right key
fileMessageViewerWrapper.onkeydown = (event) => {
    if (event.key === 'ArrowLeft') {
        fileMessageList.moveBackFile();
        fileMessageList.renderFileMessageList();
    }

    if (event.key === 'ArrowRight') {
        fileMessageList.moveNextFile();
        fileMessageList.renderFileMessageList();
    }

    if (event.key === 'Escape') {
        if (!fileMessageViewerWrapper.classList.contains('hidden')) {
            fileMessageViewerWrapper.classList.add('hidden');
        }
    }
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