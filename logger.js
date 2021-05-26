const fs = require('fs');




/*
    This function/middleware writes log data to log file (txt file)
    @param {object} req - Express request object
*/
function writeLog(req, res, next) {
    const logFilePath = './log/log.txt';

    // Create folder and log file if not existed
    if (!fs.existsSync(logFilePath)) {
        if (!fs.existsSync('./log/')) {
            fs.mkdirSync('./log/');
        }

        const fileDescriptor = fs.openSync(logFilePath, 'w');

        fs.writeFileSync(fileDescriptor, `[DD-MM-YYYY HH24:MM:SS]    ${'USER-ID'.padEnd(36)}    USER-TYPE    METHOD    STATUS-CODE    URL\n`, { encoding : 'utf8' });
        fs.closeSync(fileDescriptor);
    }

    // Get current timestamp
    const dateNow = new Date(Date.now());
    let now;
    {
        let date = dateNow.getDate() >= 10 ? dateNow.getDate() : ('0' + dateNow.getDate());
        let month = dateNow.getMonth() >= 10 ? (dateNow.getMonth() + 1) : ('0' + (dateNow.getMonth() + 1));
        let year = dateNow.getFullYear();

        let hour = dateNow.getHours() >= 10 ? dateNow.getHours() : ('0' + dateNow.getHours());
        let minute = dateNow.getMinutes() >= 10 ? dateNow.getMinutes() : ('0' + dateNow.getMinutes());
        let second = dateNow.getSeconds() >= 10 ? dateNow.getSeconds() : ('0' + dateNow.getSeconds());

        now = `[${date}-${month}-${year}  ${hour}:${minute}:${second}]`;
    }

    // Only append log data in which URL is not a file request
    if (!req.url.includes('.')) {
        let userID;
        let userType;
        if (!req.session || !req.session.user) {
            userID = 'guest';
            userType = 'guest'
        } else {
            userID = req.session.user.userID;
            userType = req.session.user.userType;
        }

        //               [DD-MM-YYYY HH:MM:SS]    userID                  userType                 method                   statusCode                               URL
        const logData = `\n${now.padEnd(23)}    ${userID.padEnd(36)}    ${userType.padEnd(9)}    ${req.method.padEnd(8)}  ${res.statusCode.toString().padEnd(13)}  ${req.url}\n`;

        // Append data to log file
        fs.appendFile(logFilePath, logData, { encoding: 'utf8' }, (err) => {
            if (err) {
                throw err;
            }
        });
    }

    next();
}


module.exports = {
    writeLog
};