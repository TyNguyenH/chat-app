const fs = require('fs');
const https = require('https');
const path = require('path');
const FileType = require('file-type');
const crypto = require('crypto');

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const socket = require('socket.io');
const session = require('express-session');
const serverAPI = require('./routes/server-api');

require('dotenv').config();
const db = require('./database/db');
// const dbFunctions = require('./db-functions');





// Redirect http to https
const http = express();
http.get('*', function (req, res) {
    console.log(`REDIRECT TO ==> ${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}${req.url}`);
    res.redirect(`${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}${req.url}`);
})
http.listen(process.env.HOST_PORT);


const app = express();
let httpsServer = https.createServer({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert')
}, app).listen(process.env.HOST_PORT_SECURE);


// Logger
function log(req, notification) {
    console.log(`[Warning]:  ${req.method}  ${req.url}  ${notification}`);
}


// Use session middleware
app.use(session({
    secret: 's3cr3t k3y',
    resave: true,
    saveUninitialized: false,
    cookie: {
        // require an https-enabled website for a secure cookie
        // secure: true
    }
}));


// Register view engine
app.set('view engine', 'ejs');


// Set application's views to 'public' folder
app.set('views', 'public');


app.disable('x-powered-by');


// Allow only same origin
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.7.20:3000');
    next();
})


// Home page
app.get('/', (req, res) => {
    // Prevent browser from caching home page
    res.header('Cache-Control', 'no-store, max-age=0');

    if (!req.session.user) {
        res.redirect('/login');
    } else {
        res.redirect('/home');
    }
});


// Registering page
app.get('/register', (req, res) => {
    res.sendFile('./public/register.html', { root: __dirname });
});


// Login page
app.get('/login', (req, res) => {
    if (req.session.user) {
        res.redirect('/home');
    } else {
        res.sendFile('./public/login.html', { root: __dirname });
    }
});


// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            log(req, 'Error destroying session:');
            console.log(err);
        }
    });
    res.redirect('/login');
});


// Home page
app.get('/home', (req, res) => {
    // Prevent browser from caching
    res.header('Cache-Control', 'no-store, max-age=0');

    if (!req.session.user) {
        res.redirect('/login');
    } else {
        db.query(`SELECT userid, firstname, lastname, avatar
                FROM UserInfo
                WHERE userid = ${req.session.user.userID}`, (err, dbRes) => {
            if (err) {
                log(req, 'Error getting username and avatar:');
                console.log(err);
            } else {
                let userID = dbRes.rows[0].userid;
                let firstName = dbRes.rows[0].firstname;
                let lastName = dbRes.rows[0].lastname;
                let avatarSrc = dbRes.rows[0].avatar;

                let data = { userID, firstName, lastName, avatarSrc };
                res.render('home', data);
            }
        });
    }
});


// Friend list page
app.get('/friend-list', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        // Get user info
        db.query(`SELECT userid, firstname, lastname, avatar
                FROM UserInfo
                WHERE userid = ${req.session.user.userID}` ,

            async (err, dbRes) => {
                if (err) {
                    log(req, 'Error getting user info:');
                    console.log(err);
                } else {
                    const userID = dbRes.rows[0].userid;
                    const firstName = dbRes.rows[0].firstname;
                    const lastName = dbRes.rows[0].lastname;
                    const avatarSrc = dbRes.rows[0].avatar;

                    const data = { userID, firstName, lastName, avatarSrc };

                    res.render('friend-list.ejs', data);
                }
            }
        );
    }
});


/* 
    Store temporary users' registering data (use email as a property to access tempRegister)

    tempRegister = {
        email: {
            firstName:      {string}
            lastName:       {string}
            hashedPass:     {string}
            avatarFilePath: {string}
            secretCode:     {string}
            beginTime:      {number | Date.now()},
            expire:         {number}
        },
        ...
    }
*/ 
let tempRegister = {}


/* 
    Store temporary login info
    If user failed logging in every 5 times, server will force user to wait 5^n (minutes), n > 1

    tempLogin = {
        email: {
            loginCount: {number}
            startWait:  {number (mili seconds)}
            waitTime:   {number (mili seconds)}
        }
    }
*/
let tempLogin = {}


// Set storage engine
const storage = multer.diskStorage({
    destination: './public/avatars/',
    filename: (req, file, cb) => {
        const emailPattern = /^\b[\w\.-]+@[\w\.-]+\.\w{1,}\b$/g;
        if (req.body.email.match(emailPattern)) {
            // Set name for avatar image
            let avatarFileName = file.fieldname + '_' + Date.now() + path.extname(file.originalname);
            cb(null, avatarFileName);

            tempRegister[req.body.email] = {};
            tempRegister[req.body.email].avatarFilePath = '/avatars/' + avatarFileName;
        }   
    }
});


// Initialize single image file upload
const upload = multer({
    storage: storage
}).single('avatar');


// Handling registered form data
app.post('/register', (req, res) => {
    upload(req, res, (err) => {
        let fullFormData = true;
        for (let prop in req.body) {
            if (req.body[prop].length == 0) {
                fullFormData = false;
                break;
            }
        }

        if (fullFormData && !err) {
            const emailPattern = /^\b[\w\.-]+@[\w\.-]+\.\w{1,}\b$/g;
            const fullNamePattern =
                /^([(a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựýỳỵỷỹ)\s]{1,})$/g;

            let email = req.body['email'];
            let password = req.body['password'];
            let firstName = req.body['first-name'];
            let lastName = req.body['last-name'];

            if (email.match(emailPattern) && firstName.match(fullNamePattern) && lastName.match(fullNamePattern)) {
                tempRegister[email].firstName = firstName;
                tempRegister[email].lastName = lastName;

                let shaSum = crypto.createHash('sha256');
                const hashedPass = shaSum.update(password).digest('hex');
                tempRegister[email].hashedPass = hashedPass;

                shaSum = crypto.createHash('sha256');
                const secretCode = shaSum.update(`${Date.now()} s3cr3tK3Y`).digest('hex');
                tempRegister[email].secretCode = secretCode;
                tempRegister[email].beginTime = Date.now();
                tempRegister[email].expire = 43200000;
                
                // Config mail server
                let transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: {
                        user: 'chatapp.auth.noreply@gmail.com',
                        pass: 'z!2)3LpG*%~U'
                    }
                });

                // Initialize mail options
                let mailOptions = {
                    from: 'chatapp.auth.noreply@gmail.com',
                    to: email,
                    subject: 'Xác thực email',
                    html: `<div style="margin: auto; text-align:center;">
                            <p style="font-weight: bold; font-size: 22px;">Vui lòng click chọn xác thực để hoàn thành đăng ký:</p>
                            <a style="padding: 7px 8px; border: none; border-radius: 5px; background-color: #4287f5; color: white; text-decoration: none; font-weight: bold; font-size: 22px; cursor: pointer;" href="${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}/register/auth/${email}/${tempRegister[email].secretCode = secretCode}" target="_blank">Xác thực</a>
                        </div>`
                }
                
                // Proceed sending email
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) {
                        console.log(err);
                        res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
                    } else {
                        console.log(`Message sent to: ${email}`);
                        console.log(info.response, '\n');
                    }
                });

                res.render('notification.ejs', { message: 'Bạn vui lòng check email để xác thực tài khoản'})
            } else {
                res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
            }
        } else {
            res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
        }
    });
});


// Authenticate user email
app.get('/register/auth/:email/:secretCode', (req, res) => {
    let email = req.params.email;

    if (tempRegister[email]
        && req.params.secretCode == tempRegister[email].secretCode
        && Date.now() - tempRegister[email].beginTime <= tempRegister[email].expire) {
        
        let hashedPass = tempRegister[email].hashedPass;
        let firstName = tempRegister[email].firstName;
        let lastName = tempRegister[email].lastName;
        let avatarFilePath = tempRegister[email].avatarFilePath;

        // Insert data into UserAccount table
        db.query(`INSERT INTO UserAccount (email, userpassword) VALUES ('${email}', '${hashedPass}') RETURNING userid`, (err, dbRes) => {
            if (err) {
                log(req, 'Error inserting data into UserAccount:');
                console.log(err);

                res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
            } else {
                // Insert data into UserInfo table
                let userID = dbRes.rows[0].userid;

                const sql = `
                    INSERT INTO UserInfo (userID, firstName, lastName, avatar, createDate, isActive, firstNameEng, lastNameEng)
                    VALUES (${userID}, '${firstName}', '${lastName}', '${avatarFilePath}', NOW()::DATE, true, convertVnToEng(firstName), convertVnToEng(lastName))
                `;

                db.query(sql, (err) => {
                    if (err) {
                        log(req, 'Error inserting data into UserInfo:');
                        console.log(err);

                        res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
                    } else {
                        // Pop out temporary user registering data when user registered successfully
                        delete tempRegister[email];

                        res.sendFile('./public/successful-reg.html', { root: __dirname });
                    }
                });
            }
        });
    } 
    
    else {
        // Delete user data if email authentication failed
        if (tempRegister[email]) {
            fs.unlinkSync(path.join(__dirname, 'public', tempRegister[email].avatarFilePath));
            delete tempRegister[email];
        }
        
        res.sendFile('./public/unsuccessful-reg.html', { root: __dirname });
    }
})


// Handling login data
app.use(express.urlencoded({ extended: true }));
app.post('/login', (req, res) => {
    console.log(tempLogin);

    const invalidLetters = /[^\w@\.-]/g;
    let email = req.body.email.replace(invalidLetters, '');

    // Checking login attempt
    if (tempLogin[email] && (tempLogin[email].loginCount == 0) && (Date.now() - tempLogin[email].startWait <= tempLogin[email].waitTime)) {
        let remainingWaitTime = (tempLogin[email].waitTime - (Date.now() - tempLogin[email].startWait)) / 1000;
        if (remainingWaitTime >= 60) {
            const minute = Math.ceil(remainingWaitTime / 60);
            remainingWaitTime = `${minute} phút`;
        } else {
            remainingWaitTime = `${Math.floor(remainingWaitTime)} giây`;
        }

        res.render('login-notification', { message: `Bạn đã đăng nhập sai quá 5 lần. Vui lòng đợi khoảng ${remainingWaitTime} nữa` });
    } else {
        const shaSum = crypto.createHash('sha256');
        const hashedPass = shaSum.update(req.body.password).digest('hex');

        const sql = `
        SELECT a.userId, a.email, a.userPassword
        FROM UserAccount a, UserInfo b
        WHERE a.userId = b.userId
            AND a.email = '${email}'
            AND b.isActive = true
        `;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error checking user login:');
                console.log(err);
            } else {
                let userID;
                let correctLogin = false;
                let correctEmail = false;
                let correctPassword = false;

                if (dbRes.rows.length == 1) {
                    correctEmail = true;

                    let password = dbRes.rows[0].userpassword;
                    if (hashedPass == password) {
                        correctPassword = true;
                        correctLogin = true;
                        userID = dbRes.rows[0].userid;
                    }
                }

                if (!correctLogin) {
                    let message = '';

                    if (!correctEmail) {
                        message = 'Sai email!';
                    } else if (!correctPassword) {
                        message = 'Sai mật khẩu !';

                        // Start counting login attempts
                        if (!tempLogin[email]) {
                            tempLogin[email] = {};
                            tempLogin[email].loginCount = 5 - 1;
                            tempLogin[email].startWait = Date.now();
                            tempLogin[email].waitTime = 0;
                        }
                        // Continue counting login attempts
                        else {
                            // Initialize waiting time
                            if (tempLogin[email].loginCount == 0 && tempLogin[email].waitTime == 0) {
                                tempLogin[email].waitTime = 300000;
                            }

                            // Decrease login attempts
                            if (tempLogin[email].loginCount > 0) {
                                tempLogin[email].loginCount -= 1;
                            }

                            // Reset counting login attempts & increase waiting time, if waiting time is over
                            if (tempLogin[email].loginCount == 0 && tempLogin[email].waitTime > 0 && (Date.now() - tempLogin[email].startWait >= tempLogin[email].waitTime)) {
                                tempLogin[email].loginCount = 5 - 1;
                                tempLogin[email].startWait = Date.now();
                                tempLogin[email].waitTime *= 5;
                            }
                        }
                    }

                    res.render('login-notification', { message });
                } else {
                    // Remove checking login attempts (if exist)
                    if (tempLogin[email]) {
                        delete tempLogin[email];
                    }

                    req.session.user = {
                        userID: userID
                    }
                    res.redirect('/home');
                }
            }
        });
    }    
});


// End points that serve request and send data to client side
app.use('/api/', serverAPI);


// Return 404 page when no resources found
app.use((req, res, next) => {
    // Redirect to 404 page if requested resource is notification page
    let requestResource = req.url.replace('/', '');
    let notificationPages = ['successful-reg.html', 'unsuccessful-reg.html', 'notification'];
    if (notificationPages.includes(requestResource)) {
        res.redirect('/404.html');
    }

    // Redirect to 404 page if requested url is not valid
    let validPath = fs.existsSync(path.join(__dirname, 'public', req.url));

    // If user is not logged in and tries to access images or avatars file, then redirect to 404.html
    if (validPath && (req.url.includes('avatar') || req.url.includes('user-imgs') ) && !req.session.user) {
        res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
    }

    if (!validPath) {
        console.log(path.join(__dirname, 'public', req.url));
        console.log('Wrong path !');
        res.redirect('/404.html');
    } else {
        next();
    }
}, express.static(path.join(__dirname, 'public')));






// Handling chat io
let activeUsers = {};
let io = socket(httpsServer);
io.on('connection', (socket) => {
    console.log('new socket | socketID: ' + socket.id);


    // Get user info when socket is connected
    socket.emit('connected');
    socket.on('user info', (userData) => {
        activeUsers[userData.userID] = {};
        activeUsers[userData.userID].userSocketID = userData.userSocketID;
        activeUsers[userData.userID].userFullName = userData.userFullName;
        activeUsers[userData.userID].userAvatarSrc = userData.userAvatarSrc;

        console.log(activeUsers);

        // Emit back active users data to newly connected socket
        io.sockets.emit('active users', activeUsers);
    });


    socket.on('message', (messageData) => {
        const creatorID = Number.parseInt(messageData.senderID);
        const recipientID = Number.parseInt(messageData.recipientID);

        // Save message data into MessageInfo and MessageRecipient table
        if (messageData.messageText && messageData.recipientID && !messageData.recipientGroupID) {
            const messageText = messageData.messageText;
            const createDate = messageData.createDate;
            console.log(messageData);

            let sql = `
                INSERT INTO MessageInfo (creatorID, messageText, createDate)
                VALUES (${creatorID}, E'${messageText}', TO_TIMESTAMP('${createDate}', 'DD-MM-YYYY HH24:MI:SS'))
                RETURNING messageid, TO_CHAR(createDate, 'DD-MM-YYYY HH24:MI:SS') as createdate;
            `;

            db.query(sql, (err, dbRes) => {
                if (err) {
                    console.log('Error inserting new message data');
                    console.log(err);
                } else {
                    let messageID = dbRes.rows[0].messageid;
                    messageData.messageID = messageID;
                    messageData.isRead = false;
                    messageData.createDate = dbRes.rows[0].createdate;

                    // Send back original message to sender to make sure that message is successfully sent
                    socket.emit('message', messageData);

                    // Send message to specific recipient
                    if (activeUsers[messageData.recipientID].userSocketID) {
                        io.to(activeUsers[messageData.recipientID].userSocketID).emit('message', messageData);
                    }

                    sql = `
                        INSERT INTO MessageRecipient (messageID, recipientID, hasRead)
                        VALUES (${messageID}, ${recipientID}, false)
                    `;
                    db.query(sql, (err) => {
                        if (err) {
                            console.log('Error inserting data into message recipient');
                            console.log(err);
                        }
                    })
                }
            });
        }
        
    })


    socket.on('seen message', (messageData) => {
        console.log(messageData);
        let messageIDs;
        if (Array.isArray(messageData.messageID)) {
            messageIDs = messageData.messageID.filter(Boolean).join(',');
        } else {
            messageIDs = messageData.messageID.toString();
        }

        if (messageIDs) {
            const sql = `
                UPDATE MessageRecipient
                SET hasRead = true
                WHERE messageID IN (${messageIDs})
                    AND hasRead = false
            `;

            db.query(sql, (err) => {
                if (err) {
                    console.log(socket.id, 'Error updating seen message');
                }
            })
            console.log(messageData);

            if (activeUsers[messageData.senderID]) {
                io.to(activeUsers[messageData.senderID].userSocketID).emit('seen message', messageData);
            }
            
            if (activeUsers[messageData.recipientID]) {
                io.to(activeUsers[messageData.recipientID].userSocketID).emit('seen message', messageData);
            }
        }
        console.log(messageData);
    })


    socket.on('chat message', (data) => {
        console.log('message: ' + data.message + ' | socketID: ' + socket.id);
        console.log('image-type: ' + data['image-type'] + ' | socketID: ' + socket.id);
        socket.broadcast.emit('chat message', data);;

        // Save image file to server
        if (data.image) {
            (async () => {
                let imgBuffer = Buffer.from(data.image);
                let imgType = await FileType.fromBuffer(imgBuffer);
                if (imgType.ext) {
                    let dateString = Date.now();
                    let fileOutputName = `img_${data.username}_${dateString}.${imgType.ext}`;

                    let writeStream = fs.createWriteStream(fileOutputName);
                    writeStream.write(imgBuffer);
                    writeStream.end();

                    console.log('Write image successfully!');
                } else {
                    console.log('Can\'t write image file!');
                }
            })();
        }
    })


    socket.on('typing', (messageData) => {
        console.log('userID:' + messageData.senderID + ' typing' + ' | socketID: ' + socket.id);

        const userID = messageData.recipientID;
        if (activeUsers[userID]) {
            io.to(activeUsers[userID].userSocketID).emit('typing', messageData);
        }
    })

    
    socket.on('stopped typing', (messageData) => {
        console.log('userID:' + messageData.senderID + ' stoped typing' + ' | socketID: ' + socket.id);

        const userID = messageData.recipientID;
        if (activeUsers[userID]) {
            io.to(activeUsers[userID].userSocketID).emit('stopped typing');
        }
    })


    socket.on('disconnect', () => {
        console.log('socket disconnected | socketID: ' + socket.id);

        // Broadcast to other sockets that a socket has disconnected
        for (let userID in activeUsers) {
            if (activeUsers[userID].userSocketID == socket.id) {
                socket.broadcast.emit('user disconnection', { userID, userSocketID: socket.id });
                delete activeUsers[userID];
            }
        }
        console.log(activeUsers);
    });
});
