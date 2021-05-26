const db = require('./db');


// This module provides functions that query database
module.exports = {
    /* 
        Get friend(s) info

        @param {Object} searchOption - {
            friendID:       {number}
            firstName:      {string}
            lastName:       {string}
            friendStatus:   {'friend' | 'request'}
        }
        
        @param {Object} resultOption - {
            friendID:        {boolean}
            firstName:       {boolean}
            lastName:        {boolean}
            avatar:          {boolean}
            friendStatus:    {boolean}
            actionUserID:    {boolean}
        }

        @return {Array} friends - an array of friends, each friend is an object
    */
    getFriendsInfo: async function (userID, searchOption, resultOption) {
        let invalidPattern =
            /[^a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựýỳỵỷỹ\s]/g;
        let dbRes = null;
        let sql = null;

        let friendIdResult = null;
        let firstNameResult = null;
        let lastNameResult = null;
        let avatarResult = null;
        let friendStatusResult = null;
        let actionUserIdResult = null;
        
        if (userID && (searchOption && Object.keys(searchOption).length > 0) && (resultOption && Object.keys(resultOption).length > 0)) {
            if (resultOption.friendID) {
                friendIdResult = 'userID';
            }

            if (resultOption.firstName) {
                firstNameResult = 'firstName';
            }

            if (resultOption.lastName) {
                lastNameResult = 'lastName';
            }

            if (resultOption.avatar) {
                avatarResult = 'avatar';
            }

            if (resultOption.friendStatus) {
                friendStatusResult = 'friendStatus';
            }

            if (resultOption.actionUserID) {
                actionUserIdResult = 'actionUserID';
            }


            // Search with friendID
            if (searchOption.friendID) {
                let tempFriends = {};
                let friendIDs;
                if (Array.isArray(searchOption.friendID)) {
                    friendIDs = searchOption.friendID.join(',');
                } else {
                    friendIDs = searchOption.friendID;
                }
                

                let columns = ['userID as friendID', firstNameResult, lastNameResult, avatarResult].filter(Boolean).join(',');
                sql = `
                    SELECT ${columns}
                    FROM UserInfo
                    WHERE userID IN (${friendIDs})
                        AND isActive IS TRUE
                `;
                dbRes = await db.asyncQuery(sql);
                
                for (let row of dbRes.rows) {
                    tempFriends[row.friendid] = {};

                    if (friendIdResult) {
                        tempFriends[row.friendid].friendID = row.friendid;
                    }

                    if (firstNameResult) {
                        tempFriends[row.friendid].friendFirstName = row.firstname;
                    }

                    if (lastNameResult) {
                        tempFriends[row.friendid].friendLastName = row.lastname;
                    }

                    if (avatarResult) {
                        tempFriends[row.friendid].friendAvatarSrc = row.avatar;
                    }

                    if (friendStatusResult) {
                        tempFriends[row.friendid].friendStatus = '';
                    }

                    if (actionUserIdResult) {
                        tempFriends[row.friendid].actionUserID = '';
                    }
                }

                columns = [friendStatusResult, actionUserIdResult].filter(Boolean).join(',');
                sql = `
                    SELECT ${columns},
                        CASE
                            WHEN userID1 IN (${friendIDs}) THEN userID1
                            WHEN userID2 IN (${friendIDs}) THEN userID2
                            ELSE null
                        END AS friendID
                    FROM Friendship
                    WHERE 
                            (userID1 = ${userID}
                            AND userID2 IN (${friendIDs}))
                        OR 
                            (userID1 IN (${friendIDs})
                            AND userID2 = ${userID})
                `;
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    if (!row.friendid) {
                        continue;
                    } else {
                        if (tempFriends[row.friendid] && friendStatusResult) {
                            tempFriends[row.friendid].friendStatus = row.friendstatus;
                        }

                        if (tempFriends[row.friendid] && actionUserIdResult) {
                            tempFriends[row.friendid].actionUserID = row.actionuserid;
                        }
                    }
                }

                let friends = [];
                for (let key in tempFriends) {
                    friends.push(tempFriends[key]);
                }

                return friends;
            }


            // Search with friend status only
            if (searchOption.friendStatus && !searchOption.firstName && !searchOption.lastName) {
                let friendIDs = [];
                let tempFriends = {};

                let friendStatusCondition;
                if (searchOption.friendStatus == 'friend') {
                    friendStatusCondition = `friendStatus = 'friend'`;
                }
                if (searchOption.friendStatus == 'request') {
                    friendStatusCondition = `friendStatus = 'request'`;
                }

                let columns = [friendStatusResult, actionUserIdResult].filter(Boolean).join(',');
                sql = `
                    SELECT ${columns},
                        CASE
                            WHEN userID1 != ${userID} THEN userID1
                            WHEN userID2 != ${userID} THEN userID2
                            ELSE null
                        END AS friendID
                    FROM Friendship
                    WHERE  (userID1 = ${userID}
                            OR userID2 = ${userID})
                        AND ${friendStatusCondition}
                `;
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    if (!row.friendid) {
                        continue;
                    } else {
                        friendIDs.push(row.friendid);
                        tempFriends[row.friendid] = {};

                        if (friendStatusResult) {
                            tempFriends[row.friendid].friendStatus = row.friendstatus;
                        }

                        if (actionUserIdResult) {
                            tempFriends[row.friendid].actionUserID = row.actionuserid;
                        }
                    }
                }


                if (friendIDs.length > 0) {
                    friendIDs = friendIDs.join(',');

                    columns = ['userID as friendID', firstNameResult, lastNameResult, avatarResult, 'isActive'].filter(Boolean).join(',');

                    sql = `
                        SELECT DISTINCT ${columns}
                        FROM UserInfo
                        WHERE userID IN (${friendIDs})
                    `;
                    dbRes = await db.asyncQuery(sql);

                    for (let row of dbRes.rows) {
                        if (tempFriends[row.friendid]) {
                            // Friend is active
                            if (row.isactive == true) {
                                if (friendIdResult) {
                                    tempFriends[row.friendid].friendID = row.friendid;
                                }

                                if (firstNameResult) {
                                    tempFriends[row.friendid].friendFirstName = row.firstname;
                                }

                                if (lastNameResult) {
                                    tempFriends[row.friendid].friendLastName = row.lastname;
                                }

                                if (avatarResult) {
                                    tempFriends[row.friendid].friendAvatarSrc = row.avatar;
                                }
                            } 
                            
                            // Friend is not active
                            else {
                                delete tempFriends[row.friendid];
                            }
                        }
                    }

                    let friends = [];
                    for (let key in tempFriends) {
                        friends.push(tempFriends[key]);
                    }

                    return friends;
                } else {
                    return [];
                }
            }
            

            // Search with friend status && (first name || last name)
            if (searchOption.friendStatus && (searchOption.firstName || searchOption.lastName)) {
                let friendIDs = [];
                let tempFriends = {};

                let friendStatusCondition;
                if (searchOption.friendStatus == 'friend') {
                    friendStatusCondition = `friendStatus = 'friend'`;
                }
                if (searchOption.friendStatus == 'request') {
                    friendStatusCondition = `friendStatus = 'request'`;
                }

                let columns = [friendStatusResult, actionUserIdResult].filter(Boolean).join(',');
                sql =  `
                    SELECT ${columns},
                        CASE
                            WHEN userID1 != ${userID} THEN userID1
                            WHEN userID2 != ${userID} THEN userID2
                            ELSE null
                        END AS friendID
                    FROM Friendship
                    WHERE  (userID1 = ${userID}
                            OR userID2 = ${userID})
                        AND ${friendStatusCondition}
                `; 
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    if (!row.friendid) {
                        continue;
                    } else {
                        friendIDs.push(row.friendid);
                        tempFriends[row.friendid] = {};

                        if (friendStatusResult) {
                            tempFriends[row.friendid].friendStatus = row.friendstatus;
                        }

                        if (actionUserIdResult) {
                            tempFriends[row.friendid].actionUserID = row.actionuserid;
                        }
                    }
                }
                

                if (friendIDs.length > 0) {
                    friendIDs = friendIDs.join(',');

                    let firstNameCondition;
                    if (searchOption.firstName) {
                        searchOption.firstName = searchOption.firstName.replace(invalidPattern, '');
                        firstNameCondition = `(firstName ILIKE '%${searchOption.firstName}%' OR firstNameEng ILIKE '%${searchOption.firstName}%')`;
                    }

                    let lastNameCondition;
                    if (searchOption.lastName) {
                        searchOption.lastName = searchOption.lastName.replace(invalidPattern, '');
                        lastNameCondition = `(lastName ILIKE '%${searchOption.lastName}%' OR lastNameEng ILIKE '%${searchOption.lastName}%')`;
                    }

                    let fullNameCondition = [firstNameCondition, lastNameCondition].filter(Boolean).join(' OR ');

                    columns = ['userID as friendID', firstNameResult, lastNameResult, avatarResult, 'isActive'].filter(Boolean).join(',');
                    
                    sql = `
                        SELECT DISTINCT ${columns}
                        FROM UserInfo
                        WHERE ${fullNameCondition}
                            AND userID IN (${friendIDs})
                    `;
                    dbRes = await db.asyncQuery(sql);

                    for (let row of dbRes.rows) {
                        if (tempFriends[row.friendid]) {
                            // Friend is active
                            if (row.isactive == true) {
                                if (friendIdResult) {
                                    tempFriends[row.friendid].friendID = row.friendid;
                                }

                                if (firstNameResult) {
                                    tempFriends[row.friendid].friendFirstName = row.firstname;
                                }

                                if (lastNameResult) {
                                    tempFriends[row.friendid].friendLastName = row.lastname;
                                }

                                if (avatarResult) {
                                    tempFriends[row.friendid].friendAvatarSrc = row.avatar;
                                }
                            } 

                            // Friend is not active
                            else {
                                delete tempFriends[row.friendid];
                            }
                        }
                    }

                    let friends = [];
                    for (let key in tempFriends) {
                        if ((firstNameResult && !tempFriends[key].friendFirstName) || (lastNameResult && !tempFriends[key].friendLastName)) {
                            continue;
                        } else {
                            friends.push(tempFriends[key]);
                        }
                    }

                    return friends;
                } else {
                    return [];
                }
            }


            // Search with first name || last name
            if (!searchOption.friendStatus && (searchOption.firstName || searchOption.lastName)) {
                let firstNameCondition;
                if (searchOption.firstName) {
                    searchOption.firstName = searchOption.firstName.replace(invalidPattern, '');
                    firstNameCondition = `(firstName ILIKE '%${searchOption.firstName}%' OR firstNameEng ILIKE '%${searchOption.firstName}%')`;
                }

                let lastNameCondition;
                if (searchOption.lastName) {
                    searchOption.lastName = searchOption.lastName.replace(invalidPattern, '');
                    lastNameCondition = `(lastName ILIKE '%${searchOption.lastName}%' OR lastNameEng ILIKE '%${searchOption.lastName}%')`;
                }

                let fullNameCondition = [firstNameCondition, lastNameCondition].filter(Boolean).join(' OR ');

                let tempFriends = {};
                let friendIDs = [];

                let columns = ['userID as friendID', firstNameResult, lastNameResult, avatarResult].filter(Boolean).join(',');
                
                sql = `
                    SELECT DISTINCT ${columns}
                    FROM UserInfo
                    WHERE (${fullNameCondition})
                        AND userID != ${userID}
                        AND isActive IS TRUE
                `;
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    tempFriends[row.friendid] = {};
                    friendIDs.push(row.friendid);

                    if (friendIdResult) {
                        tempFriends[row.friendid].friendID = row.friendid;
                    }

                    if (firstNameResult) {
                        tempFriends[row.friendid].friendFirstName = row.firstname;
                    }

                    if (lastNameResult) {
                        tempFriends[row.friendid].friendLastName = row.lastname;
                    }

                    if (avatarResult) {
                        tempFriends[row.friendid].friendAvatarSrc = row.avatar;
                    }

                    if (friendStatusResult) {
                        tempFriends[row.friendid].friendStatus = '';
                    }

                    if (actionUserIdResult) {
                        tempFriends[row.friendid].actionUserID = '';
                    }
                }

                // Found friendIDs are used to update friends' friendship info
                if (friendIDs.length > 0) {
                    friendIDs = friendIDs.join(',');

                    columns = [friendStatusResult, actionUserIdResult].filter(Boolean).join(',');
                    sql = `
                        SELECT ${columns},
                            CASE
                                WHEN userID1 IN (${friendIDs}) then userID1 
                                WHEN userID2 IN (${friendIDs}) then userID2
                                ELSE null
                            END AS friendID
                        FROM Friendship
                        WHERE   (userID1 = ${userID}
                                AND userID2 IN (${friendIDs}))
                            OR 
                                (userID1 IN (${friendIDs})
                                AND userID2 = ${userID})
                    `;
                    dbRes = await db.asyncQuery(sql);

                    for (let row of dbRes.rows) {
                        if (!row.friendid) {
                            continue;
                        } else {
                            if (tempFriends[row.friendid] && friendStatusResult) {
                                tempFriends[row.friendid].friendStatus = row.friendstatus;
                            }

                            if (tempFriends[row.friendid] && actionUserIdResult) {
                                tempFriends[row.friendid].actionUserID = row.actionuserid;
                            }
                        }
                    }

                    let friends = [];
                    for (let key in tempFriends) {
                        friends.push(tempFriends[key]);
                    }

                    return friends;
                } else {
                    return [];
                }
            }
        } 
        
        // Search all available friends (request, friend)
        else if (userID && (!searchOption || Object.keys(searchOption) == 0) && (resultOption && Object.keys(resultOption).length > 0)) {
            if (resultOption.friendID) {
                friendIdResult = 'userID';
            }

            if (resultOption.firstName) {
                firstNameResult = 'firstName';
            }

            if (resultOption.lastName) {
                lastNameResult = 'lastName';
            }

            if (resultOption.avatar) {
                avatarResult = 'avatar';
            }

            if (resultOption.friendStatus) {
                friendStatusResult = 'friendStatus';
            }

            if (resultOption.actionUserID) {
                actionUserIdResult = 'actionUserID';
            }

            let friendIDs = [];
            let tempFriends = {};

            let columns = [friendStatusResult, actionUserIdResult].filter(Boolean).join(',');
            sql = `
                SELECT ${columns},
                    CASE
                        WHEN userID1 != ${userID} THEN userID1
                        WHEN userID2 != ${userID} THEN userID2
                        ELSE null
                    END AS friendID
                FROM Friendship
                WHERE  (userID1 = ${userID}
                        OR userID2 = ${userID})
            `;
            dbRes = await db.asyncQuery(sql);

            for (let row of dbRes.rows) {
                if (!row.friendid) {
                    continue;
                } else {
                    friendIDs.push(row.friendid);
                    tempFriends[row.friendid] = {};

                    if (friendStatusResult) {
                        tempFriends[row.friendid].friendStatus = row.friendstatus;
                    }

                    if (actionUserIdResult) {
                        tempFriends[row.friendid].actionUserID = row.actionuserid;
                    }
                }
            }

            if (friendIDs.length > 0) {
                friendIDs = friendIDs.join(',');

                columns = ['userID as friendID', firstNameResult, lastNameResult, avatarResult, 'isActive'].filter(Boolean).join(',');
                sql = `
                    SELECT DISTINCT ${columns}
                    FROM UserInfo
                    WHERE userID IN (${friendIDs})
                `;
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    if (tempFriends[row.friendid]) {
                        // Friend is active
                        if (row.isactive == true) {
                            if (friendIdResult) {
                                tempFriends[row.friendid].friendID = row.friendid;
                            }

                            if (firstNameResult) {
                                tempFriends[row.friendid].friendFirstName = row.firstname;
                            }

                            if (lastNameResult) {
                                tempFriends[row.friendid].friendLastName = row.lastname;
                            }

                            if (avatarResult) {
                                tempFriends[row.friendid].friendAvatarSrc = row.avatar;
                            }
                        }
                        
                        // Friend is not active
                        else {
                            delete tempFriends[row.friendid];
                        }
                    }
                }

                let friends = [];
                for (let key in tempFriends) {
                    friends.push(tempFriends[key]);
                }

                return friends;
            } else {
                return [];
            }
        }
        
        else {
            return [];
        }
    },


    /*
        @param {Object} searchOption - {
            creatorID:          {Array | number}
            recipientID:        {Array | number}
            recipientGroupID:   {number}
            dateFrom:           {string}
            dateTo:             {string}
            isRead:             {boolean}
            offset:             {number}
            limit:              {number}
        }

        @param {Object} resultOption - {
            messageID:          {boolean}
            creatorID:          {boolean}
            recipientID:        {boolean}
            recipientGroupID:   {boolean}
            messageText:        {boolean}
            filePath:           {boolean}
            fileType:           {boolean}
            createDate:         {boolean}
            isRead:             {boolean}
        }

        @return {Array} messages - an array of messages, each message is an object
    */
    getMessages: async function (searchOption, resultOption) {
        if (!searchOption || !resultOption || Object.keys(searchOption).length == 0 || Object.keys(resultOption).length == 0) {
            return [];
        }

        else if (searchOption && resultOption && Object.keys(searchOption).length > 0 && Object.keys(resultOption).length > 0) {
            let dbRes = null;
            let sql = null;

            /* Clean up and create search conditions */
            let creatorIdCondition = null;
            let recipientIdCondition = null;
            let recipientGroupIdCondition = null;
            let dateFromCondition = null;
            let dateToCondition = null;
            let isReadCondition = null;
            let offsetCondition = '';
            let limitCondition = '';
            {
                if (searchOption.creatorID) {
                    if (Array.isArray(searchOption.creatorID) && searchOption.creatorID.length > 0) {
                        const creatorIDs = searchOption.creatorID.filter(Boolean).join(',');
                        creatorIdCondition = `creatorID IN (${creatorIDs})`;
                    } else if (typeof searchOption.creatorID == 'number') {
                        creatorIdCondition = `creatorID = ${searchOption.creatorID}`;
                    }
                }

                if (searchOption.recipientID) {
                    if (Array.isArray(searchOption.recipientID) && searchOption.recipientID.length > 0) {
                        const recipientIDs = searchOption.recipientID.filter(Boolean).join(',');
                        recipientIdCondition = `recipientID IN (${recipientIDs})`;
                    } else if (typeof searchOption.creatorID == 'number') {
                        recipientIdCondition = `recipientID = ${searchOption.recipientID}`;
                    }
                }

                if (searchOption.recipientGroupID && typeof searchOption.recipientGroupID == 'number') {
                    recipientGroupIdCondition = `recipientGroupID = ${searchOption.recipientGroupID}`;
                }

                /* Date format DD-MM-YYYY [HH:MM:SS] [24-hour system]*/
                const datePattern = /^((\d{1,2}-\d{1,2}-\d{4})(\s\d{1,2}:\d{1,2}:\d{1,2})?)$/g
                const timestampPattern = /^((\d{1,2}-\d{1,2}-\d{4})\s(\d{1,2}:\d{1,2}:\d{1,2}))$/g;
                if (searchOption.dateFrom && searchOption.dateFrom.length > 0 && searchOption.dateFrom.match(datePattern)) {
                    if (searchOption.dateFrom.match(timestampPattern)) {
                        dateFromCondition = `TO_TIMESTAMP('${searchOption.dateFrom}', 'DD-MM-YYYY HH24:MI:SS')`;;
                    } else {
                        // Get date part from string
                        let date = searchOption.dateFrom.match(/(\d{1,2}-\d{1,2}-\d{4})/g);
                        date = date[0];

                        dateFromCondition = `TO_TIMESTAMP('${date}', 'DD-MM-YYYY')`;;
                    }
                }
                if (searchOption.dateTo && searchOption.dateTo.length > 0 && searchOption.dateTo.match(datePattern)) {
                    if (searchOption.dateTo.match(timestampPattern)) {
                        dateToCondition = `TO_TIMESTAMP('${searchOption.dateTo}', 'DD-MM-YYYY HH24:MI:SS')`;
                    } else {
                        // Get date part from string
                        let date = searchOption.dateTo.match(/(\d{1,2}-\d{1,2}-\d{4})/g);
                        date = date[0];

                        dateToCondition = `TO_TIMESTAMP('${date}', 'DD-MM-YYYY')`;
                    }
                }

                if (searchOption.isRead == true || searchOption.isRead == false) {
                    isReadCondition = `hasRead = ${searchOption.isRead}`;
                }

                if (searchOption.offset && typeof searchOption.offset == 'number') {
                    offsetCondition = `OFFSET ${searchOption.offset}`;
                }

                if (searchOption.limit && typeof searchOption.limit == 'number') {
                    limitCondition = `LIMIT ${searchOption.limit}`;
                }
            }
            

            /* Clean up and create result options */
            let messageIdResult = null;
            let creatorIdResult = null;
            let recipientIdResult = null;
            let recipientGroupIdResult = null;
            let messageTextResult = null;
            let filePathResult = null;
            let fileTypeResult = null;
            let createDateResult = null;
            let isReadResult = null;
            {
                if (resultOption.messageID) {
                    messageIdResult = 'messageID';
                }

                if (resultOption.creatorID) {
                    creatorIdResult = 'creatorID';
                }

                if (resultOption.recipientID) {
                    recipientIdResult = 'recipientID';
                }

                if (resultOption.recipientGroupID) {
                    recipientGroupIdResult = 'recipientGroupID';
                }

                if (resultOption.messageText) {
                    messageTextResult = 'messageText';
                }

                if (resultOption.filePath) {
                    filePathResult = 'filePath';
                }

                if (resultOption.fileType) {
                    fileTypeResult = 'fileType';
                }

                if (resultOption.createDate) {
                    createDateResult = 'createdate';
                }

                if (resultOption.isRead) {
                    isReadResult = 'hasRead';
                }
            }


            let columns = ['MessageInfo.messageID', creatorIdResult, recipientIdResult, recipientGroupIdResult, messageTextResult, isReadResult].filter(Boolean).join(',');

            let dateCondition = null;
            if (dateFromCondition && dateToCondition) {
                dateCondition = `(createdate BETWEEN ${dateFromCondition} AND ${dateToCondition})`;
            } else if (dateFromCondition) {
                dateCondition = `createdate >= ${dateFromCondition}`;
            } else if (dateToCondition) {
                dateCondition = `createdate <= ${dateToCondition}`;
            }
            
            let queryConditions = [creatorIdCondition, recipientIdCondition, recipientGroupIdCondition, dateCondition, isReadCondition].filter(Boolean).join(' AND ');
            if (queryConditions.length > 0) {
                queryConditions = ' AND ' + queryConditions;
            }

            sql = `
                SELECT ${columns}
                FROM MessageInfo, MessageRecipient
                WHERE MessageInfo.messageID = MessageRecipient.messageID
                    ${queryConditions}
                ORDER BY createdate desc
                ${offsetCondition}
                ${limitCondition}
            `;
            // console.log(sql);
            dbRes = await db.asyncQuery(sql);

            let tempMessages = {};
            let messageIDs = [];
            for (let row of dbRes.rows) {
                let message = {};

                if (messageIdResult) {
                    message.messageID = Number.parseInt(row.messageid);
                }

                if (creatorIdResult) {
                    message.creatorID = Number.parseInt(row.creatorid);
                }

                if (recipientIdResult) {
                    message.recipientID = Number.parseInt(row.recipientid);
                }

                if (recipientGroupIdResult) {
                    message.recipientGroupID = row.recipientgroupid ? Number.parseInt(row.recipientgroupid) : null;
                }

                if (messageTextResult) {
                    message.messageText = row.messagetext;
                }

                if (filePathResult) {
                    message.filePath = '';
                }

                if (fileTypeResult) {
                    message.fileType = '';
                }

                if (isReadResult) {
                    message.isRead = row.hasread;
                }
                
                tempMessages[row.messageid] = message;
                messageIDs.push(row.messageid);
            }
            
            // Get all messageIDs and create messageIdCondition
            messageIDs = messageIDs.join(',');
            let messageIdCondition = '';
            if (messageIDs.length > 0) {
                messageIdCondition = `AND MessageInfo.messageID IN (${messageIDs})`;
            }

            // Get message creation timestamp
            if (messageIDs && createDateResult) {
                sql = `
                    SELECT messageID, TO_CHAR(createDate, 'DD-MM-YYYY HH24:MI:SS') as createdate
                    FROM MessageInfo
                    WHERE messageID IN (${messageIDs})
                `;
                // console.log(sql);
                dbRes = await db.asyncQuery(sql);

                for (let row of dbRes.rows) {
                    if (tempMessages[row.messageid]) {
                        tempMessages[row.messageid].createDate = row.createdate;
                    }
                }   
            }

            // Get filePath and fileType of a file message based on messageID
            columns = ['MessageInfo.messageID', filePathResult, fileTypeResult].filter(Boolean).join(',');
            sql = `
                SELECT ${columns}
                FROM MessageInfo, FileInfo
                WHERE MessageInfo.fileID = FileInfo.fileID
                    ${messageIdCondition}
                `;
            // console.log(sql)
            dbRes = await db.asyncQuery(sql);

            for (let row of dbRes.rows) {
                if (filePathResult && tempMessages[row.messageid]) {
                    tempMessages[row.messageid].filePath = row.filepath;
                }

                if (fileTypeResult && tempMessages[row.messageid]) {
                    tempMessages[row.messageid].fileType = row.filetype;
                }
            }

            // Finalize results
            let messages = [];
            for (let prop in tempMessages) {
                messages.push(tempMessages[prop]);
            }
            messages = messages.reverse();

            return messages;
        }
    },


    /*  Get file messages (images, ...)
        @param {Object} searchOption - {
            fileID:             {number}
            creatorID:          {Array | number}
            recipientID:        {Array | number}
            recipientGroupID:   {number}
            dateFrom:           {string}
            dateTo:             {string}
            offset:             {number}
            limit:              {number}
        }

        @return {array} [
            {
                fileID:         {number}
                filePath:       {string}
                fileType:       {string}
            },
            ...
        ]
    */
    getFileMessages: async function(searchOption) {
        if (!searchOption || Object.keys(searchOption).length == 0) {
            return [];
        }

        if (searchOption && Object.keys(searchOption).length > 0) {
            let dbRes = null;
            let sql = null;

            /* Clean up and create search conditions */
            let fileIdCondtion = null;
            let creatorIdCondition = null;
            let recipientIdCondition = null;
            let recipientGroupIdCondition = null;
            let dateFromCondition = null;
            let dateToCondition = null;
            let offsetCondition = '';
            let limitCondition = '';
            {
                if (searchOption.fileID && typeof searchOption.fileID == 'number') {
                    fileIdCondtion = `fileID = ${searchOption.fileID}`;
                }

                if (searchOption.creatorID) {
                    if (Array.isArray(searchOption.creatorID) && searchOption.creatorID.length > 0) {
                        const creatorIDs = searchOption.creatorID.filter(Boolean).join(',');
                        creatorIdCondition = `creatorID IN (${creatorIDs})`;
                    } else if (typeof searchOption.creatorID == 'number') {
                        creatorIdCondition = `creatorID = ${searchOption.creatorID}`;
                    }
                }

                if (searchOption.recipientID) {
                    if (Array.isArray(searchOption.recipientID) && searchOption.recipientID.length > 0) {
                        const recipientIDs = searchOption.recipientID.filter(Boolean).join(',');
                        recipientIdCondition = `recipientID IN (${recipientIDs})`;
                    } else if (typeof searchOption.creatorID == 'number') {
                        recipientIdCondition = `recipientID = ${searchOption.recipientID}`;
                    }
                }

                if (searchOption.recipientGroupID && typeof searchOption.recipientGroupID == 'number') {
                    recipientGroupIdCondition = `recipientGroupID = ${searchOption.recipientGroupID}`;
                }

                /* Date format DD-MM-YYYY [HH:MM:SS] [24-hour system]*/
                const datePattern = /^((\d{1,2}-\d{1,2}-\d{4})(\s\d{1,2}:\d{1,2}:\d{1,2})?)$/g
                const timestampPattern = /^((\d{1,2}-\d{1,2}-\d{4})\s(\d{1,2}:\d{1,2}:\d{1,2}))$/g;
                if (searchOption.dateFrom && searchOption.dateFrom.length > 0 && searchOption.dateFrom.match(datePattern)) {
                    if (searchOption.dateFrom.match(timestampPattern)) {
                        dateFromCondition = `TO_TIMESTAMP('${searchOption.dateFrom}', 'DD-MM-YYYY HH24:MI:SS')`;;
                    } else {
                        // Get date part from string
                        let date = searchOption.dateFrom.match(/(\d{1,2}-\d{1,2}-\d{4})/g);
                        date = date[0];

                        dateFromCondition = `TO_TIMESTAMP('${date}', 'DD-MM-YYYY')`;;
                    }
                }
                if (searchOption.dateTo && searchOption.dateTo.length > 0 && searchOption.dateTo.match(datePattern)) {
                    if (searchOption.dateTo.match(timestampPattern)) {
                        dateToCondition = `TO_TIMESTAMP('${searchOption.dateTo}', 'DD-MM-YYYY HH24:MI:SS')`;
                    } else {
                        // Get date part from string
                        let date = searchOption.dateTo.match(/(\d{1,2}-\d{1,2}-\d{4})/g);
                        date = date[0];

                        dateToCondition = `TO_TIMESTAMP('${date}', 'DD-MM-YYYY')`;
                    }
                }

                if (searchOption.offset && typeof searchOption.offset == 'number') {
                    offsetCondition = `OFFSET ${searchOption.offset}`;
                }

                if (searchOption.limit && typeof searchOption.limit == 'number') {
                    limitCondition = `LIMIT ${searchOption.limit}`;
                }
            }

            let dateCondition = null;
            if (dateFromCondition && dateToCondition) {
                dateCondition = `(createdate BETWEEN ${dateFromCondition} AND ${dateToCondition})`;
            } else if (dateFromCondition) {
                dateCondition = `createdate >= ${dateFromCondition}`;
            } else if (dateToCondition) {
                dateCondition = `createdate <= ${dateToCondition}`;
            }


            let queryConditions = [creatorIdCondition, recipientIdCondition, fileIdCondtion, dateCondition].filter(Boolean).join(' AND ');
            if (queryConditions.length > 0) {
                queryConditions = ' AND ' + queryConditions;
            }

            sql = `
                SELECT MessageInfo.messageID as messageID, filePath, fileType
                FROM MessageInfo, MessageRecipient, FileInfo
                WHERE MessageInfo.messageID = MessageRecipient.messageID AND MessageInfo.fileID = FileInfo.fileID AND MessageInfo.fileID IS NOT NULL
                    ${queryConditions}
                ORDER BY MessageInfo.messageID desc
                ${offsetCondition}
                ${limitCondition}
            `;
            // console.log(sql);
            dbRes = await db.asyncQuery(sql);

            let fileMessageResults = [];
            for (let row of dbRes.rows) {                
                fileMessageResults.push({
                    messageID: row.messageid,
                    filePath: row.filepath,
                    fileType: row.filetype
                });
            }
            return fileMessageResults;
        }
    },


    /* Get registration requests info
        @param {number} offset
        @param {number} limit

        @return {array} [
            {
                requestID:      {number},
                email:          {string},
                firstName:      {string},
                lastName:       {string},
                requestTime:    {string - DD-MM-YYYY HH24:MM:SS},
                avatar:         {string}
            },
            ...
        ]
    */
    getRegistrationRequests: async function (offset, limit) {
        if (typeof offset === 'number' && typeof limit === 'number') {
            try {
                const sql = `
                    SELECT requestID, email, firstName, lastName, TO_CHAR(requestTime, 'DD-MM-YYYY HH24:MI:SS') as requestTime, avatar
                    FROM AccountRegistrationRequest
                    OFFSET ${offset}
                    LIMIT ${limit}
                `;
                const dbRes = await db.asyncQuery(sql);
                
                let registrationRequests = [];
                for (let row of dbRes.rows) {
                    const request = {
                        requestID: row.requestid,
                        email: row.email,
                        firstName: row.firstname,
                        lastName: row.lastname, 
                        requestTime: row.requesttime,
                        avatar: row.avatar
                    }

                    registrationRequests.push(request);
                }

                return registrationRequests;
            } catch (err) {
                console.log(err);
                return [];
            }
        } else {
            return [];
        }
    },


    /*
        Get total number of registration requests
        
        @return {number}
    */
    getRegistrationRequestsCount: async function () {
        try {
            const sql = `
                SELECT COUNT(requestID) as count
                FROM AccountRegistrationRequest
            `;
            const dbRes = await db.asyncQuery(sql);

            if (dbRes.rows.length == 1) {
                return dbRes.rows[0].count;
            } else {
                return null;
            }
        } catch (err) {
            console.log(err);
            return null;
        }
    }
}