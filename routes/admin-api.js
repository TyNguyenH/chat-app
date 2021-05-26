const fs = require('fs');
const express = require('express');
const nodemailer = require('nodemailer');
const db = require('../database/db');
const dbFunctions = require('../database/db-functions');


let router = express.Router();


router.use(express.json());


// Send email notification to user when request registration is accepted or denied
function sendEmailNotification(email, emailContent) {
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
        subject: '[ChatApp] Đăng ký tài khoản',
        html: `<div style="margin: auto; text-align: center; font-size: large;">
                ${emailContent}
            </div>`
    }

    // Proceed sending email
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`Message sent to: ${email}`);
            console.log(info.response, '\n');
        }
    });
}


// Get account registration mode data
router.get('/registration-mode', (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const accountRegConfig = JSON.parse(fs.readFileSync('./account-registration.config.json'));
        res.send(accountRegConfig);
    } else {
        res.end();
        return;
    }
});


// Update account registration mode ('manual' || 'verify email')
router.put('/registration-mode', (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const registrationMode = req.body.registrationMode;
        if (registrationMode == 'verify email' || registrationMode == 'manual') {
            let accountRegConfig = JSON.parse(fs.readFileSync('./account-registration.config.json'));
            accountRegConfig.registrationMode = registrationMode;

            fs.writeFileSync('./account-registration.config.json', JSON.stringify(accountRegConfig, null, 2));
            res.send({ message: 'success' });
        } else {
            res.send({ message: 'fail' });
        }
    } else {
        res.end();
        return;
    }
});


// Get current total registration requests
router.get('/registration-request-count', async (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const totalRegistrationRequests = await dbFunctions.getRegistrationRequestsCount();
        if (totalRegistrationRequests) {
            res.send({ totalRegistrationRequests });
        } else {
            res.send({});
        }
    } else {
        res.end();
        return;
    }
});


// Get registration request(s) data with offset and limit
router.get('/registration-request/option', async (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const limit = Number.parseInt(req.query.limit);
        const offset = Number.parseInt(req.query.offset);

        const registrationRequests = await dbFunctions.getRegistrationRequests(offset, limit);

        console.log('\n=== Get registration requests ===');
        console.log(registrationRequests);

        res.send(registrationRequests);
    } else {
        res.end();
        return;
    }
});


// Accept user registration request
router.post('/registration-request/accept/:requestID', (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const requestID = req.params.requestID;
        const sql = `
            SELECT email, requestPassword, firstName, lastName, avatar
            FROM AccountRegistrationRequest
            WHERE requestID = ${requestID}
        `;
        db.query(sql, (err, dbRes) => {
            if (err) {
                console.log(err);
                res.send({ message: 'fail' });
            } else {
                if (dbRes.rows.length == 1) {
                    const email = dbRes.rows[0].email;
                    const hashedPass = dbRes.rows[0].requestpassword;
                    const firstName = dbRes.rows[0].firstname;
                    const lastName = dbRes.rows[0].lastname;
                    const avatarFilePath  = dbRes.rows[0].avatar;

                    const sql = `
                        INSERT INTO UserAccount (email, userPassword) VALUES('${email}', '${hashedPass}') RETURNING userID
                    `;

                    // Insert data into UserAccount table
                    db.query(sql, (err, dbRes) => {
                        if (err) {
                            console.log(err);
                            res.send({ message: 'fail' });
                        } else {
                            let userID = dbRes.rows[0].userid;

                            const sql = `
                                INSERT INTO UserInfo (userID, firstName, lastName, avatar, createDate, isActive, firstNameEng, lastNameEng)
                                VALUES (${userID}, '${firstName}', '${lastName}', '${avatarFilePath}', NOW()::DATE, true, convertVnToEng('${firstName}'), convertVnToEng('${lastName}'))
                            `;

                            // Insert data into UserInfo table
                            db.query(sql, (err) => {
                                if (err) {
                                    console.log(err);
                                    res.send({ message: 'fail' });
                                } else {
                                    const sql = `
                                        DELETE FROM AccountRegistrationRequest
                                        WHERE requestID = ${requestID}
                                    `;

                                    // Delete newly registered user from AccountRegistrationRequest
                                    db.query(sql, (err) => {
                                        if (err) {
                                            console.log(err);
                                            res.send({ message: 'fail' });
                                        } else {
                                            const message = 'Chúc mừng bạn đã đăng ký tài khoản ChatApp thành công';
                                            sendEmailNotification(email, message);
                                            res.send({ message: 'success' });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    res.send({ message: 'fail' });
                }
            }
        })
    } else {
        res.end();
        return;
    }
});


// Deny user registration request
router.delete('/registration-request/deny/:requestID', (req, res) => {
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const requestID = req.params.requestID;
        const sql = `
            DELETE FROM AccountRegistrationRequest
            WHERE requestID = ${requestID}
            RETURNING email, avatar;
        `;

        // Delete newly registered user from AccountRegistrationRequest
        db.query(sql, (err, dbRes) => {
            if (err) {
                console.log(err);
                res.send({ message: 'fail' });
            } else {
                if (dbRes.rows.length == 1) {
                    const email = dbRes.rows[0].email;
                    const avatarFilePath = dbRes.rows[0].avatar;
                    fs.unlinkSync(`./public/${avatarFilePath}`);

                    const message = 'Xin lỗi vì tài khoản ChatApp của bạn đã không được chấp nhận. Bạn vui lòng đăng ký tài khoản với thông tin phù hợp hơn';
                    sendEmailNotification(email, message);

                    res.send({ message: 'success' });
                } else {
                    res.send({ message: 'fail' });
                }
            }
        });
    } else {
        res.end();
        return;
    }
});


module.exports = router;