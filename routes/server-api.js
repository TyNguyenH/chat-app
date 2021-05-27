const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../database/db');
const dbFunctions = require('../database/db-functions');


let router = express.Router();


// Logger
function log(req, notification) {
    console.log(`[Warning]:  ${req.method}  ${req.url}  ${notification}`);
}


router.use(express.json());


// Check email if already existed
router.get('/register/email', (req, res) => {
    let emailPattern = /\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/;
    const email = req.query.email;

    if (email.match(emailPattern)) {
        db.query(`SELECT email FROM UserAccount WHERE email = '${email}'`, (err, dbRes) => {
            if (err) {
                log(req, 'Error getting user email');
                console.log(err);

                res.send({ msg: 'Database error' });
            } else {
                let data = {
                    status: ''
                };

                if (dbRes.rows.length == 0) {
                    db.query(`SELECT email FROM AccountRegistrationRequest WHERE email = '${email}'`, (err, dbRes) => {
                        if (err) {
                            log(req, 'Error getting user email');
                            console.log(err);

                            res.send({ msg: 'Database error' });
                        } else {
                            if (dbRes.rows.length == 0) {
                                data.status = 'OK';
                            } else {
                                data.status = 'requesting';
                            }
                            res.send(data);
                        }
                    })
                }
                
                if (dbRes.rows.length == 1) {
                    data.status = 'existed';
                    res.send(data);
                }
            }
        });
    } else {
        res.send({ msg: 'email not valid' });
    }
});


// Get currently logged in user full info
router.get('/personal-info', (req, res) => {
    if (!req.session || !req.session.user) {
        res.send({});
    } else {
        const userID = Number.parseInt(req.session.user.userID);
        if (userID) {
            const sql = `
                SELECT b.userID, a.email, b.firstName, b.lastName, b.avatar, TO_CHAR(b.createDate, 'DD-MM-YYYY') as createDate, isActive
                FROM UserAccount a, UserInfo b
                WHERE a.userID = b.userID
                    AND b.userID = ${userID}
            `;

            db.query(sql, (err, dbRes) => {
                if (err) {
                    console.log('Error getting full user info');
                    console.log(err);
                } else {
                    if (dbRes.rows.length == 1) {
                        const userFullInfo =  {
                            userID: dbRes.rows[0].userid,
                            email: dbRes.rows[0].email,
                            firstName: dbRes.rows[0].firstname,
                            lastName: dbRes.rows[0].lastname,
                            avatarSrc: dbRes.rows[0].avatar,
                            dateJoined: dbRes.rows[0].createdate,
                            isActive: dbRes.rows[0].isactive
                        }; 
                        res.send(userFullInfo);
                    }
                }
            });
        } else {
            res.send({});
        }
    }
});


/* 
    This variable is used for authenticating user when updating password
    {object} tempUserAccount: {
        email: {
            newHashedPassword:  {string}
            secretCode:         {string}
            beginTime:          {number | Date.now()}
            maxAge:             {number}
        }
    }
*/
let tempUserUpdateAccount = {};


// Update user's password
router.put('/user-account', (req, res) => {
    if (!req.session || !req.session.user) {
        res.send({});
    } else {
        const userID = Number.parseInt(req.session.user.userID);
        if (userID) {
            let response = { message: 'fail' };
            let oldPassword = req.body.oldPassword;
            let newPassword = req.body.newPassword;
            
            let shaSum = crypto.createHash('sha256');
            const oldHashedPassword = shaSum.update(oldPassword).digest('hex');

            shaSum = crypto.createHash('sha256');
            const newHashedPassword = shaSum.update(newPassword).digest('hex');

            // Update password
            if (oldHashedPassword && newHashedPassword) {
                let sql = `
                    SELECT email, userPassword
                    FROM UserAccount
                    WHERE userID = ${userID}
                `;

                db.query(sql, (err, dbRes) => {
                    if (err) {
                        console.log(err);
                        res.send(response);
                    } 
                    
                    // Correct userID
                    if (dbRes.rows.length == 1) {
                        const userPassword = dbRes.rows[0].userpassword;
                        const email = dbRes.rows[0].email;

                        // Correct old password
                        if (oldHashedPassword === userPassword) {
                            shaSum = crypto.createHash('sha256');
                            const secretCode = shaSum.update(`${oldPassword}-->${newPassword}:)`).digest('hex');

                            tempUserUpdateAccount[email] = {};
                            tempUserUpdateAccount[email].newHashedPassword = newHashedPassword;
                            tempUserUpdateAccount[email].secretCode = secretCode;
                            tempUserUpdateAccount[email].beginTime = Date.now();
                            tempUserUpdateAccount[email].maxAge = 43200000;

                            // Config mail server
                            let transporter = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: {
                                    user: 'chatapp.auth.noreply@gmail.com',
                                    pass: 'bzhmxvupgvdqvsck'
                                }
                            });

                            // Initialize mail options
                            let mailOptions = {
                                from: 'chatapp.auth.noreply@gmail.com',
                                to: email,
                                subject: '[ChatApp] Cập nhật mật khẩu',
                                html: `<div style="margin: auto; text-align:center;">
                                            <p style="font-weight: bold; font-size: 22px;">Vui lòng click chọn xác thực để hoàn thành cập nhật mật khẩu:</p>
                                            <a style="padding: 7px 8px; border: none; border-radius: 5px; background-color: #4287f5; color: white; text-decoration: none; font-weight: bold; font-size: 22px; cursor: pointer;" href="${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}/api/user-account/auth/${email}/${secretCode}" target="_blank">Xác thực</a>
                                        </div>`
                            }

                            // Proceed sending email
                            transporter.sendMail(mailOptions, (err, info) => {
                                if (err) {
                                    console.log(err);
                                    res.send(response);
                                } else {
                                    console.log(`Message sent to: ${email}`);
                                    console.log(info.response, '\n');

                                    // Delete temporary updating account when valid time is over
                                    setTimeout(() => {
                                        if (tempUserUpdateAccount[email]) {
                                            delete tempUserUpdateAccount[email];
                                        }
                                    }, 43200000);

                                    response.message = 'success';
                                    res.send(response);
                                }
                            });
                        } 
                        
                        // Incorrect old password
                        else {
                            res.send(response);
                        }
                    }

                    // Incorrect userID
                    if (dbRes.rows.length == 0) {
                        res.send(response);
                    }
                });
            }
        }
    }
});


// Authenticate user email when changing password
router.get('/user-account/auth/:email/:secretCode', (req, res) => {
    const email = req.params.email;
    const emailPattern = /^\b[\w\.-]+@[\w\.-]+\.\w{1,}\b$/g;
    const secretCode = req.params.secretCode;

    if (tempUserUpdateAccount[email] && email.match(emailPattern)
        && secretCode === tempUserUpdateAccount[email].secretCode
        && Date.now() - tempUserUpdateAccount[email].beginTime <= tempUserUpdateAccount[email].maxAge) {

        const newHashedPassword = tempUserUpdateAccount[email].newHashedPassword;

        sql = `
            UPDATE UserAccount
            SET userPassword = '${newHashedPassword}'
            WHERE email = '${email}'
        `;

        db.query(sql, (err) => {
            if (err) {
                console.log(err);
                res.send(response);
            } else {
                // Pop out temporary user registering data when user registered successfully
                delete tempUserUpdateAccount[email];

                const message = 'Cập nhật mật khẩu <br> thành công';
                res.render('notification.ejs', { message });
            }
        });
    } else {
        if (tempUserUpdateAccount[email]) {
            delete tempUserUpdateAccount[email];
        }

        const message = 'Cập nhật mật khẩu <br> không thành công';
        res.render('notification.ejs', { message });
    }
});


// Search friend(s) info
router.get('/friend-list/option', async (req, res) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login');
    } else {
        const userID = req.session.user.userID;
        const queryString = req.query;

        if (queryString) {
            let searchOption = {};
            let resultOption = {};

            /* Check query string search option */
            {
                if (queryString.searchFriendID) {
                    searchOption.friendID = Number.parseInt(queryString.searchFriendID);
                }

                if (queryString.searchFirstName) {
                    searchOption.firstName = queryString.searchFirstName;
                }

                if (queryString.searchLastName) {
                    searchOption.lastName = queryString.searchLastName;
                }

                if (queryString.searchFriendStatus) {
                    if (queryString.searchFriendStatus == 'friend' || queryString.searchFriendStatus == 'request') {
                        searchOption.friendStatus = queryString.searchFriendStatus;
                    }
                }
            }


            /* Check query string result option */
            {
                if (queryString.resultFriendID) {
                    resultOption.friendID = true;
                }

                if (queryString.resultFirstName) {
                    resultOption.firstName = true;
                }

                if (queryString.resultLastName) {
                    resultOption.lastName = true;
                }

                if (queryString.resultAvatar) {
                    resultOption.avatar = true;
                }

                if (queryString.resultFriendStatus) {
                    resultOption.friendStatus = true;
                }

                if (queryString.resultActionUserID) {
                    resultOption.actionUserID = true;
                }
            }
            
            if (Object.keys(searchOption) == 0) {
                searchOption = null;
            }

            friends = await dbFunctions.getFriendsInfo(userID, searchOption, resultOption);

            console.log('\n=== Get friend(s)\' info ===');
            console.log('searchOption:', searchOption);
            console.log('resultOption:', resultOption);
            console.log('Search results:');
            console.log(friends);

            res.send({ friends });
        } else {
            res.send({ friends: [] });
        }
    }
});


// Get messages of current session user and user's friend
router.get('/messages/option', async (req, res) => {
    if (!req.session || !req.session.user) {
        res.redirect('/login');
    } else {
        let searchOption = {};
        let resultOption = {};
        let validRequest = false;
        const userID = req.session.user.userID;
        const queryString = req.query;
        
        if (queryString) {
            /* Check queryString search option */
            {
                if (queryString.searchCreatorID) {
                    let creatorID = null;

                    // searchCreatorID is an array
                    if (queryString.searchCreatorID.includes('[')) {
                        creatorID = queryString.searchCreatorID.replace(/[\[\]]/g, '');
                        creatorID = creatorID.split(',');
                        creatorID = creatorID.map((ID) => {
                            if (ID == userID) {
                                validRequest = true;
                            }
                            return Number.parseInt(ID);
                        });
                    } 

                    // searchCreatorID is a string number
                    else {
                        if (creatorID == userID) {
                            validRequest = true;
                        }
                        creatorID = Number.parseInt(queryString.searchCreatorID);
                    }

                    searchOption.creatorID = creatorID;
                }

                if (queryString.searchRecipientID) {
                    let recipientID = null;

                    // searchRecipientID is an array
                    if (queryString.searchRecipientID.includes('[')) {
                        recipientID = queryString.searchRecipientID.replace(/[\[\]]/g, '');
                        recipientID = recipientID.split(',');
                        recipientID = recipientID.map((ID) => {
                            if (ID == userID) {
                                validRequest = true;
                            }
                            return Number.parseInt(ID);
                        });
                    } 
                    
                    // searchRecipientID is a string number
                    else {
                        if (recipientID == userID) {
                            validRequest = true;
                        }
                        recipientID = Number.parseInt(queryString.searchRecipientID);
                    }
                    searchOption.recipientID = recipientID;
                }

                if (queryString.searchRecipientGroupID) {
                    searchOption.recipientGroupID = Number.parseInt(queryString.searchRecipientGroupID);
                }

                if (queryString.searchDateFrom) {
                    searchOption.dateFrom = queryString.searchDateFrom;
                }

                if (queryString.searchDateTo) {
                    searchOption.dateTo = queryString.searchDateTo;
                }

                if (queryString.searchIsRead) {
                    searchOption.isRead = queryString.searchIsRead == 'true' ? true : false;
                }

                if (queryString.searchOffset) {
                    searchOption.offset = Number.parseInt(queryString.searchOffset);
                }

                if (queryString.searchLimit) {
                    searchOption.limit = Number.parseInt(queryString.searchLimit);
                }
            }


            /* Check queryString result option */
            {
                if (queryString.resultMessageID) {
                    resultOption.messageID = queryString.resultMessageID == 'true' ? true : false;
                }

                if (queryString.resultCreatorID) {
                    resultOption.creatorID = queryString.resultCreatorID == 'true' ? true : false;
                }

                if (queryString.resultRecipientID) {
                    resultOption.recipientID = queryString.resultRecipientID == 'true' ? true : false;
                }

                if (queryString.resultRecipientGroupID) {
                    resultOption.recipientGroupID = queryString.resultRecipientGroupID == 'true' ? true : false;
                }

                if (queryString.resultMessageText) {
                    resultOption.messageText = queryString.resultMessageText == 'true' ? true : false;
                }

                if (queryString.resultFilePath) {
                    resultOption.filePath = queryString.resultFilePath == 'true' ? true : false;
                }

                if (queryString.resultFileType) {
                    resultOption.fileType = queryString.resultFileType == 'true' ? true : false;
                }

                if (queryString.resultCreateDate) {
                    resultOption.createDate = queryString.resultCreateDate == 'true' ? true : false;
                }

                if (queryString.resultIsRead) {
                    resultOption.isRead = queryString.resultIsRead == 'true' ? true : false;
                }
            }

            console.log('\n=== Get messages ===');
            console.log('searchOption:', searchOption);
            console.log('resultOption:', resultOption);

            if (validRequest) {
                const messages = await dbFunctions.getMessages(searchOption, resultOption);
                res.send({ messages });
            } else {
                res.send({ messages: [] });
            }
        } else {
            res.send({ messages: [] });
        }
    }
});


// Get file messages (images, ...)
router.get('/file-messages/option', async (req, res) => {
    let searchOption = {};
    let validRequest = false;
    const userID = req.session.user.userID;
    const queryString = req.query;

    if (queryString) {
        /* Check queryString search option */
        {
            if (queryString.searchCreatorID) {
                let creatorID = null;

                // searchCreatorID is an array
                if (queryString.searchCreatorID.includes('[')) {
                    creatorID = queryString.searchCreatorID.replace(/[\[\]]/g, '');
                    creatorID = creatorID.split(',');
                    creatorID = creatorID.map((ID) => {
                        if (ID == userID) {
                            validRequest = true;
                        }
                        return Number.parseInt(ID);
                    });
                }

                // searchCreatorID is a string number
                else {
                    if (creatorID == userID) {
                        validRequest = true;
                    }
                    creatorID = Number.parseInt(queryString.searchCreatorID);
                }

                searchOption.creatorID = creatorID;
            }

            if (queryString.searchRecipientID) {
                let recipientID = null;

                // searchRecipientID is an array
                if (queryString.searchRecipientID.includes('[')) {
                    recipientID = queryString.searchRecipientID.replace(/[\[\]]/g, '');
                    recipientID = recipientID.split(',');
                    recipientID = recipientID.map((ID) => {
                        if (ID == userID) {
                            validRequest = true;
                        }
                        return Number.parseInt(ID);
                    });
                }

                // searchRecipientID is a string number
                else {
                    if (recipientID == userID) {
                        validRequest = true;
                    }
                    recipientID = Number.parseInt(queryString.searchRecipientID);
                }
                searchOption.recipientID = recipientID;
            }

            if (queryString.searchDateFrom) {
                searchOption.dateFrom = queryString.searchDateFrom;
            }

            if (queryString.searchDateTo) {
                searchOption.dateTo = queryString.searchDateTo;
            }

            if (queryString.searchOffset) {
                searchOption.offset = Number.parseInt(queryString.searchOffset);
            }

            if (queryString.searchLimit) {
                searchOption.limit = Number.parseInt(queryString.searchLimit);
            }
        }

        console.log('\n=== Get file messages ===');
        console.log('searchOption:', searchOption);

        if (validRequest) {
            const fileMessages = await dbFunctions.getFileMessages(searchOption);
            res.send({ fileMessages });
        } else {
            res.send({ fileMessages: [] });
        }
    } else {
        res.send({ fileMessages: [] });
    }
});


// Friend request
router.post('/friend-list/add-friend/:friendID', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        const friendID = Number.parseInt(req.params.friendID);

        if (userID && friendID) {
            const sql = `INSERT INTO Friendship VALUES (${userID}, ${friendID}, 'request', ${userID})`;
            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error inserting data into friendship table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success' });
                }
            });
        }
    }
});


// Accept friend request
router.put('/friend-list/accept/:friendID', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        const friendID = Number.parseInt(req.params.friendID);

        if (userID && friendID) {
            const sql = `
                UPDATE Friendship
                SET friendStatus = 'friend'
                WHERE actionUserID = ${friendID}
                    AND ( 
                            (userid1 = ${userID} AND userid2 = ${friendID})
                            OR (userid1 = ${friendID} AND userid2 = ${userID})
                        )
            `;

            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error updating data from friendship table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success' });
                }
            });
        }
    }
})


// Deactivate user account
router.put('/deactivate-user', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        if (userID) {
            const sql = `
                UPDATE UserInfo
                SET isActive = FALSE
                WHERE userID = ${userID}
            `;
            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error setting isActive to FALSE in UserInfo table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success' });
                }
            })
        }
    }
})


// Deactivate user account
router.put('/activate-user', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        if (userID) {
            const sql = `
                UPDATE UserInfo
                SET isActive = TRUE
                WHERE userID = ${userID}
            `;
            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error setting isActive to TRUE in UserInfo table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success'});
                }
            })
        }
    }
})


// Unfriend
router.delete('/friend-list/unfriend/:friendID', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        const friendID = Number.parseInt(req.params.friendID);

        if (userID && friendID) {
            const sql = `
                DELETE FROM Friendship 
                WHERE (userid1 = ${userID} AND userid2 = ${friendID})
                    OR (userid1 = ${friendID} AND userid2 = ${userID})
            `;

            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error deleting data from friendship table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success' });
                }
            });
        }
    }
});


// Decline friend request
router.delete('/friend-list/decline/:friendID', (req, res) => {
    if (req.session && req.session.user) {
        const userID = Number.parseInt(req.session.user.userID);
        const friendID = Number.parseInt(req.params.friendID);

        if (userID && friendID) {
            const sql = `
                DELETE FROM Friendship 
                WHERE (userid1 = ${userID} AND userid2 = ${friendID})
                    OR (userid1 = ${friendID} AND userid2 = ${userID})
                    AND actionUserID = ${friendID}
            `;

            db.query(sql, (err) => {
                if (err) {
                    log(req, 'Error deleting data from friendship table');
                    console.log(err);
                    res.send({ msg: 'error' });
                } else {
                    res.send({ msg: 'success' });
                }
            });
        }
    }
});


module.exports = router;