const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const session = require('express-session');
const serverAPI = require('./routes/server-api');

require('dotenv').config();
const db = require('./database/db');






const app = express();


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
        // Require an https-enabled website for a secure cookie
        secure: true
    }
}));


// Register view engine
app.set('view engine', 'ejs');


// Set application's views to 'public' folder
app.set('views', 'public');


app.disable('x-powered-by');


// Allow only same origin
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', `${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}`);
    next();
})


// Home route
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
                WHERE userid = ${req.session.user.userID}`,

            (err, dbRes) => {
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


// Show full personal info of currently logged in user
app.get('/personal-info', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        const userID = Number.parseInt(req.session.user.userID);
        if (userID) {
            // Get user info
            db.query(`SELECT userid, firstname, lastname, avatar
                FROM UserInfo
                WHERE userid = ${req.session.user.userID}`,

                (err, dbRes) => {
                    if (err) {
                        log(req, 'Error getting user info:');
                        console.log(err);
                    } else {
                        const userID = dbRes.rows[0].userid;
                        const firstName = dbRes.rows[0].firstname;
                        const lastName = dbRes.rows[0].lastname;
                        const avatarSrc = dbRes.rows[0].avatar;

                        const data = { userID, firstName, lastName, avatarSrc };

                        res.render('personal-info.ejs', data);
                    }
                }
            );
        } else {
            res.redirect('/home');
        }
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


// Authenticate user email, if it's correct then proceed to creating new account
app.get('/register/auth/:email/:secretCode', (req, res) => {
    const emailPattern = /^\b[\w\.-]+@[\w\.-]+\.\w{1,}\b$/g;
    const email = req.params.email;
    const secretCode = req.params.secretCode;

    if (tempRegister[email] && email.match(emailPattern)
        && secretCode == tempRegister[email].secretCode
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
});


/*
    Store temporary login info
    If user failed logging in every 5 times, server will force user to wait 5^n (minutes), n > 1

    tempLogin = {
        email: {
            loginCount: {number}
            startWait:  {number (mili seconds)}
            waitTime:   {number (mili seconds)}
        },
        ...
    }
*/
let tempLogin = {};


// Handling login data
app.use(express.urlencoded({ extended: true }));
app.post('/login', (req, res) => {
    const invalidLetters = /[^\w@\.-]/g;
    let email = req.body.email.replace(invalidLetters, '');

    // Checking login attempt
    if (tempLogin[email] && (tempLogin[email].loginCount == 0) && (Date.now() - tempLogin[email].startWait <= tempLogin[email].waitTime)) {
        // Remaining time (in second)
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
                        message = 'Tài khoản email không tồn tại !';
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
                            // Decrease login attempts
                            if (tempLogin[email].loginCount > 0) {
                                tempLogin[email].loginCount -= 1;

                                if (tempLogin[email].loginCount == 0 && tempLogin[email].waitTime == 0) {
                                    tempLogin[email].waitTime = 300000;
                                }
                            }

                            // Reset counting login attempts & increase waiting time, if waiting time is over
                            if (tempLogin[email].loginCount == 0 && tempLogin[email].waitTime > 0 && (Date.now() - tempLogin[email].startWait >= tempLogin[email].waitTime)) {
                                tempLogin[email].loginCount = 5 - 1;
                                tempLogin[email].startWait = Date.now();
                                tempLogin[email].waitTime *= 5;

                                // If waiting is exceeding maximum number value, restart to 5 minutes
                                if (tempLogin[email].waitTime == Number.MAX_SAFE_INTEGER) {
                                    tempLogin[email].waitTime = 300000;
                                }
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

    console.log('Login attempt(s):', tempLogin);
});


// End points that serve request and send data to client side
app.use('/api/', serverAPI);


// Return 404 page when no resources found
const staticFileCacheTime = 86400000 // (24-hour)
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
        // Move to serving static files
        next();
    }
}, express.static(path.join(__dirname, 'public'), {
    maxAge: staticFileCacheTime
}));


module.exports = app;
