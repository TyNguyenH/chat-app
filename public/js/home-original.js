let socket = io();
socket.connect('http://localhost:3000');


let sendForm = document.querySelector('#send-form');
let username = document.querySelector('#username');
let input = document.querySelector('#message-text');
let chatMsgGroup = document.querySelector('#messages-group');
let data = {
    username: '',
    message: ''
};


function imagePreview(inputELement, container) {
    if (inputELement.files) {
        let fileReader = new FileReader();

        fileReader.onload = function (event) {
            container.innerHTML = `<img id="image-to-send" src=${event.target.result}>`;
        }

        if (inputELement.files[0].size < 500000) {
            fileReader.readAsDataURL(inputELement.files[0]);
        } else {
            alert('Image too large! (Size has to be less than 500KB)');
        }
    }
}

let filesInput = document.getElementById('message-file');
filesInput.onchange = function () {
    // Preview image before sending
    let imgsContainter = document.getElementById('imgs-containter');
    imagePreview(this, imgsContainter);

    // Check if the image is less than 500kB
    let fileReader = new FileReader();
    fileReader.onload = () => {
        let arrayBuffer = fileReader.result;
        if (arrayBuffer.byteLength < 500000) {
            data['image'] = arrayBuffer;
            data['image-type'] = this.files[0].type;
        }
    }
    fileReader.readAsArrayBuffer(this.files[0]);
};

// Send message
sendForm.onsubmit = (event) => {
    event.preventDefault();

    if (username.value) {
        data.username = username.value;
        data.message = input.value;

        let chatMsgGroup = document.querySelector('#messages-group');
        if (data.message) {
            chatMsgGroup.innerHTML += `<p class="my-message"><span class="message-username">${data.username}</span> ${data.message} </p>`;
        }

        if (data.image) {
            let imgElement = document.getElementById('image-to-send');
            let imgSrc = imgElement.getAttribute('src');

            chatMsgGroup.innerHTML += `<p class="my-message"><span class="message-username">${data.username}</span> <img src=${imgSrc}> </p>`;
        }
        
        socket.emit('chat message', data);
        input.value = '';

        // Auto scroll to bottom when new message is received
        chatMsgGroup.scrollTop = chatMsgGroup.scrollHeight;
    }
};

// Send feedback on typing
input.onkeydown = () => {
    data.username = username.value;
    if (data.username) {
        socket.emit('typing', data);
    }
};

// Send feedback on stoped typing
input.onkeyup = () => {
    data.username = username.value;
    if (data.username && input.value.length == 0) {
        socket.emit('stopped typing', data);
    }
};

// Receive broadcasted message
socket.on('chat message', (receivedData) => {
    let feedback = document.querySelector('#feedback');
    feedback.style.visibility = 'hidden';

    if (receivedData.username != data.username) {
        if (receivedData.message) {
            chatMsgGroup.innerHTML += `<p class="received-message"><span class="message-username">${receivedData.username}</span> ${receivedData.message} </p>`;
        }

        if (receivedData.image) {
            let fileReader = new FileReader();
            let imgBlob = new Blob([new Uint8Array(receivedData.image)], { type: receivedData['image-type'] });
            
            fileReader.onload = () => {
                let imgSrc = fileReader.result;
                chatMsgGroup.innerHTML += `<p class="received-message"><span class="message-username">${receivedData.username}</span> <img src=${imgSrc}> </p>`;
            }
            fileReader.readAsDataURL(imgBlob);
        }
    }
    
    // Auto scroll to bottom when new message is received
    setTimeout(() => {
        chatMsgGroup.scrollTop = chatMsgGroup.scrollHeight;
    }, 200);
});

// Receive feedback on typing
socket.on('typing', (receivedData) => {
    let feedback = document.querySelector('#feedback');
    feedback.textContent = `${receivedData.username} is typing . . .`;
    feedback.style.visibility = 'visible';
})

// Receive feedback on typing
socket.on('stopped typing', () => {
    let feedback = document.querySelector('#feedback');
    feedback.style.visibility = 'hidden';
})