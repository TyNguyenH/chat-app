const express = require('express');
const db = require('../database/db');
const dbFunctions = require('../db-functions');


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

                if (dbRes.rows == 0) {
                    data.status = 'OK';
                    res.send(data);
                } else {
                    data.status = 'existed';
                    res.send(data);
                }
            }
        });
    } else {
        res.send({ msg: 'email not valid' });
    }
});


// Search friend(s) info
router.get('/friend-list/option', async (req, res) => {
    if (!req.session.user) {
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
    if (!req.session.user) {
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


// Friend request
router.post('/friend-list/add-friend/:friendID', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        const userID = req.session.user.userID;
        const friendID = req.params.friendID;
        const sql = 
            `INSERT INTO Friendship VALUES (${userID}, ${friendID}, 'request', ${userID})`;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error inserting data into friendship table');
                console.log(err);
                res.send({ msg: 'error' });
            } else {
                res.send({ msg: 'success' });
            }
        })
    }
});


// Accept friend request
router.put('/friend-list/accept/:friendID', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        const userID = req.session.user.userID;
        const friendID = req.params.friendID;
        const sql = 
            `UPDATE Friendship
            SET friendStatus = 'friend'
            WHERE actionUserID = ${friendID}
                AND ( 
                        (userid1 = ${userID} AND userid2 = ${friendID})
                        OR (userid1 = ${friendID} AND userid2 = ${userID})
                    )`;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error updating data from friendship table');
                console.log(err);
                res.send({ msg: 'error' });
            } else {
                res.send({ msg: 'success' });
            }
        })
    }
})


// Unfriend
router.delete('/friend-list/unfriend/:friendID', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        const userID = req.session.user.userID;
        const friendID = req.params.friendID;
        const sql = 
            `DELETE 
            FROM Friendship 
            WHERE (userid1 = ${userID} AND userid2 = ${friendID})
                OR (userid1 = ${friendID} AND userid2 = ${userID})`;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error deleting data from friendship table');
                console.log(err);
                res.send({ msg: 'error' });
            } else {
                res.send({ msg: 'success' });
            }
        })
    }
});


// Decline friend request
router.delete('/friend-list/decline/:friendID', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        const userID = req.session.user.userID;
        const friendID = req.params.friendID;
        const sql =
            `DELETE 
            FROM Friendship 
            WHERE (userid1 = ${userID} AND userid2 = ${friendID})
                OR (userid1 = ${friendID} AND userid2 = ${userID})
                AND actionUserID = ${friendID}`;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error deleting data from friendship table');
                console.log(err);
                res.send({ msg: 'error' });
            } else {
                res.send({ msg: 'success' });
            }
        })
    }
});


module.exports = router;