const fs = require('fs');
const FileType = require('file-type');

const https = require('https');
const express = require('express');
const socket = require('socket.io');
const app = require('./app');

require('dotenv').config();
const db = require('./database/db');



// Redirect http to https
const http = express();
http.get('*', function (req, res) {
    console.log(`REDIRECT TO ==> ${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}${req.url}`);
    res.redirect(`${process.env.HOST_ADDRESS}:${process.env.HOST_PORT_SECURE}${req.url}`);
})
http.listen(process.env.HOST_PORT);

// Initialize https server
const httpsServer = https.createServer({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert')
}, app).listen(process.env.HOST_PORT_SECURE);


/*
    activeUsers = {
        userID: {
            userSocketID:   {string}
            userFullName:   {string}
            userAvatarSrc:  {string}
        },
        ...
    }
*/
let activeUsers = {};

/*
    tempMessages = {
        messageID: {
            creatorID:      {number}
            fileBuffer:     {buffer}
            filePath:       {string}
            fileType:       {string}
        },
        ...
    }
*/
let tempMessages = {};

// Handling chat io
let io = socket(httpsServer);
io.on('connection', (socket) => {
    console.log('new socket | socketID: ' + socket.id);

    // Get user info when socket is connected
    socket.emit('connected');
    socket.on('user info', (userData) => {
        // Check if user active status in database is true or not, then decide whether or not to add userData into activeUsers
        const userID = Number.parseInt(userData.userID);
        if (userID) {
            const sql = `SELECT userID, isActive FROM UserInfo WHERE userID = ${userID}`;
            db.query(sql, (err, dbRes) => {
                if (err) {
                    console.log('Error selecting userID, isActive FROM UserInfo');
                    console.log(err);
                } else {
                    if (dbRes.rows.length == 1) {
                        const isActive = dbRes.rows[0].isactive;
                        if (isActive == true) {
                            activeUsers[userData.userID] = {};
                            activeUsers[userData.userID].userSocketID = userData.userSocketID;
                            activeUsers[userData.userID].userFullName = userData.userFullName;
                            activeUsers[userData.userID].userAvatarSrc = userData.userAvatarSrc;

                            console.log('active users:', activeUsers);

                            // Emit back active users data to newly connected socket
                            io.sockets.emit('active users', activeUsers);
                        }
                    }
                }
            });
        }
    });

    // Handle messageText and messageFile (file < 500KB)
    socket.on('message', (messageData) => {
        const creatorID = Number.parseInt(messageData.senderID);
        const recipientID = Number.parseInt(messageData.recipientID);

        // Save message data into MessageInfo (FileInfo if messageData contains file data) and MessageRecipient table
        if (creatorID && recipientID && !messageData.recipientGroupID
            && (messageData.messageText || (messageData.file && messageData.fileType && messageData.fileType.includes('image')))) {

            const createDate = messageData.createDate;
            let sql = `
                INSERT INTO MessageInfo (creatorID, createDate)
                VALUES (${creatorID}, TO_TIMESTAMP('${createDate}', 'DD-MM-YYYY HH24:MI:SS'))
                RETURNING messageID, TO_CHAR(createDate, 'DD-MM-YYYY HH24:MI:SS') as createDate;
            `;

            db.query(sql, async (err, dbRes) => {
                if (err) {
                    console.log('Error inserting (creatorID, createDate) into MessageInfo');
                    console.log(err);
                } else {
                    const messageID = dbRes.rows[0].messageid;
                    messageData.messageID = messageID;
                    messageData.isRead = false;
                    messageData.createDate = dbRes.rows[0].createdate;

                    sql = `
                        INSERT INTO MessageRecipient (messageID, recipientID, hasRead)
                        VALUES (${messageID}, ${recipientID}, false);
                    `

                    db.query(sql, (err) => {
                        if (err) {
                            console.log('Error inserting into MessageRecipient table');
                            console.log(err);
                        }
                    })

                    // Update messageText from MessageInfo table if messageData contains messageText
                    let messageText = messageData.messageText;
                    if (messageText) {
                        sql = `
                            UPDATE MessageInfo
                            SET messageText = E'${messageText}'
                            WHERE messageID = ${messageID}
                        `;

                        db.query(sql, (err) => {
                            if (err) {
                                console.log('Error updating messageText from MessageInfo');
                                console.log(err);
                            }
                        })
                    }

                    // Insert new data to FileInfo table and update fileID from MessageInfo table
                    if (messageData.file && messageData.fileType) {
                        // Save image file to server
                        let imgBuffer = Buffer.from(messageData.file);
                        const imgType = await FileType.fromBuffer(imgBuffer);

                        if (imgType.ext) {
                            let dateNow = Date.now();

                            // image naming format: img_messageID_currentTime.imageType
                            let fileOutput = `public/imgs/user-imgs/img_${messageID}_${dateNow}.${imgType.ext}`;

                            // Write buffer to file
                            let writeStream = fs.createWriteStream(fileOutput);
                            writeStream.write(imgBuffer);
                            writeStream.end();

                            messageData.file = `/imgs/user-imgs/img_${messageID}_${dateNow}.${imgType.ext}`;
                            messageData.fileType = imgType.ext;

                            console.log('Write image successfully !');

                            sql = `
                                INSERT INTO FileInfo (filePath, fileType)
                                VALUES ('${messageData.file}', '${messageData.fileType}')
                                RETURNING fileID
                            `;

                            db.query(sql, (err, dbRes) => {
                                if (err) {
                                    console.log('Error inserting data into FileInfo');
                                    console.log(err);
                                } else {
                                    const fileID = dbRes.rows[0].fileid;

                                    sql = `
                                        UPDATE MessageInfo
                                        SET fileID = ${fileID}
                                        WHERE messageID = ${messageID}
                                    `;

                                    db.query(sql, (err) => {
                                        if (err) {
                                            console.log('Error updating fileID from MessageInfo');
                                            console.log(err);
                                        }
                                    });
                                }
                            })
                        };
                    }

                    // Send back original message to sender to make sure that message is successfully sent
                    socket.emit('message', messageData);

                    // Send message to specific recipient
                    if (activeUsers[messageData.recipientID]) {
                        io.to(activeUsers[messageData.recipientID].userSocketID).emit('message', messageData);
                    }
                }
            })
        }
    })

    // Initial received chunk of whole file
    socket.on('start chunk', async (messageData, callback) => {
        console.log('on start chunk', messageData);

        if (messageData.senderID && messageData.recipientID) {
            const creatorID = messageData.senderID;
            const recipientID = messageData.recipientID;
            const createDate = messageData.createDate;

            let sql = `
                INSERT INTO MessageInfo (creatorID, createDate)
                VALUES (${creatorID}, TO_TIMESTAMP('${createDate}', 'DD-MM-YYYY HH24:MI:SS'))
                RETURNING messageID
            `;

            const dbRes = await db.asyncQuery(sql);
            const messageID = dbRes.rows[0].messageid;

            // Update MessageInfo table with messageText
            const messageText = messageData.messageText;
            if (messageText) {
                sql = `
                    UPDATE MessageInfo
                    SET messageText = E'${messageText}'
                    WHERE messageID = ${messageID}
                `;

                db.query(sql, (err) => {
                    if (err) {
                        console.log('Error updating messageText from MessageInfo');
                        console.log(err);
                    }
                })
            }

            // Insert into MessageRecipient table
            {
                sql = `
                    INSERT INTO MessageRecipient (messageID, recipientID, hasRead)
                    VALUES (${messageID}, ${recipientID}, false)
                `;

                db.query(sql, (err) => {
                    if (err) {
                        console.log('Error inserting into MessageRecipient table');
                        console.log(err);
                    }
                })
            }

            // Send back messageID to sender client
            callback(messageID);
            messageData.messageID = messageID;

            tempMessages[messageID] = {};
            tempMessages[messageID].creatorID = messageData.senderID;
            tempMessages[messageID].fileBuffer = Buffer.from(messageData.file);

            socket.emit('request next chunk', messageData);
            console.log('emit next chunk', messageData);
        }
    })

    // Receive next chunk of whole file
    socket.on('next chunk', (messageData) => {
        console.log('on next chunk', messageData);
        const messageID = messageData.messageID;

        if (tempMessages[messageID] && messageData.file) {
            const totalLength = tempMessages[messageID].fileBuffer.length + messageData.file.length;
            tempMessages[messageID].fileBuffer = Buffer.concat([tempMessages[messageID].fileBuffer, messageData.file], totalLength);
            console.log(`Total length: ${totalLength} | concatenating . . .`);
        }

        socket.emit('request next chunk', messageData);
        console.log('emit request next chunk', messageData);
    })

    // Receive ending chunk of whole file
    socket.on('end chunk', (messageData) => {
        console.log('on end chunk', messageData);
        const messageID = messageData.messageID;

        if (tempMessages[messageID]) {
            const totalLength = tempMessages[messageID].fileBuffer.length + messageData.file.length;
            tempMessages[messageID].fileBuffer = Buffer.concat([tempMessages[messageID].fileBuffer, messageData.file], totalLength);

            // Read file buffer and create write stream to store file
            let finalBuffer = Buffer.from(tempMessages[messageID].fileBuffer);
            FileType.fromBuffer(finalBuffer)
                .then((imgType) => {
                    if (imgType.ext) {
                        const dateNow = Date.now();
                        const fileOutput = `public/imgs/user-imgs/img_${messageID}_${dateNow}.${imgType.ext}`;

                        console.log('Writing file . . .');

                        let writeStream = fs.createWriteStream(fileOutput);
                        writeStream.write(finalBuffer);
                        writeStream.on('error', function (err) {
                            console.log(err);
                        });
                        writeStream.end();

                        const finalFilePath = `/imgs/user-imgs/img_${messageID}_${dateNow}.${imgType.ext}`;
                        const fileType = imgType.ext;
                        messageData.file = finalFilePath;
                        messageData.fileType = fileType;

                        /*  Insert new data into FileInfo table and return fileID
                            Update MessageInfo with returned fileID */
                        {
                            let sql = `
                                INSERT INTO FileInfo (filePath, fileType)
                                VALUES ('${finalFilePath}', '${fileType}')
                                RETURNING fileID
                            `;

                            db.query(sql, (err, dbRes) => {
                                if (err) {
                                    console.log('Error inserting into FileInfo');
                                    console.log(err);
                                } else {
                                    const fileID = dbRes.rows[0].fileid;
                                    sql = `
                                        UPDATE MessageInfo
                                        SET fileID = ${fileID}
                                        WHERE messageID = ${messageID}
                                    `;

                                    db.query(sql, (err) => {
                                        if (err) {
                                            console.log('Error updating MessageInfo table with fileID');
                                            console.log(err);
                                        }
                                    });
                                }
                            })
                        }

                        // Send back original message to sender to make sure that message is successfully sent
                        socket.emit('message', messageData);

                        // Send message to specific recipient
                        if (activeUsers[messageData.recipientID]) {
                            io.to(activeUsers[messageData.recipientID].userSocketID).emit('message', messageData);
                        }

                        console.log('Writing file successfully !');

                        delete tempMessages[messageID];
                    }
                })
                .catch((error) => {
                    console.log('Error assembling file from file chunks !');
                    console.log(error);
                });
        }
    })

    socket.on('seen message', (messageData) => {
        console.log(messageData);
        let messageIDs;
        if (Array.isArray(messageData.messageID)) {
            messageIDs = messageData.messageID.filter(Boolean).join(',');
        } else if (messageData.messageID && messageData.messageID.length > 0) {
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
        let disconnectedUserID;

        // Broadcast to other sockets that a socket has disconnected
        for (let userID in activeUsers) {
            if (activeUsers[userID].userSocketID == socket.id) {
                socket.broadcast.emit('user disconnection', { userID, userSocketID: socket.id });
                disconnectedUserID = userID;
                delete activeUsers[userID];
            }
        }

        // Delete tempMessage containing disconnected userID
        for (let messageID of Object.keys(tempMessages)) {
            if (tempMessages[messageID] && tempMessages[messageID].creatorID == disconnectedUserID) {
                delete tempMessages[messageID];

                // Delete data from MessageRecipient
                {
                    let sql = `
                        DELETE FROM MessageRecipient
                        WHERE messageID = ${messageID}
                    `;

                    db.query(sql, (err) => {
                        if (err) {
                            console.log('Error deleting data from MessageRecipient');
                            console.log(err);
                        } else {
                            console.log(sql);
                        }
                    })
                }

                /*  Delete data from MessageInfo and return fileID
                    Delete data from FileInfo with returned fileID */
                {
                    sql = `
                        DELETE FROM MessageInfo
                        WHERE messageID = ${messageID}
                        RETURNING fileID
                    `;

                    db.query(sql, (err, dbRes) => {
                        if (err) {
                            console.log('Error deleting data from MessageInfo table');
                            console.log(err);
                        } else {
                            console.log(sql);
                            const fileID = dbRes.rows[0].fileID;

                            if (fileID) {
                                sql = `
                                    DELETE FROM FileInfo
                                    WHERE fileID = ${fileID}
                                `;

                                db.query(sql, (err) => {
                                    if (err) {
                                        console.log('Error deleting data from FileInfo table');
                                        console.log(err);
                                    }
                                })
                            }
                        }
                    })
                }

                break;
            }
        }

        console.log('active users:', activeUsers);
    });
});
