const fs = require('fs');
const express = require('express');
const db = require('../database/db');


let router = express.Router();


router.get('/home/', (req, res) => {
    const userType = req.session.user.userType;
    const adminID = req.session.user.userID;

    if (userType == 'admin') {
        const sql = `
            SELECT adminName
            FROM AdminAccount
            WHERE adminID = '${adminID}'
        `;

        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error getting admin name:');
                console.log(err);
            } else {
                let adminName = dbRes.rows[0].adminname;
                let avatarSrc = '/avatars/avatar_admin.png';

                let data = { adminID, adminName, avatarSrc };
                res.render('admin-views/admin-home.ejs', data);
            }
        });
    } else {
        res.end();
        return;
    }
});


// Get managing registatrion page
router.get('/home/manage-registatrion', (req, res) => {
    const adminID = req.session.user.userID;
    const userType = req.session.user.userType;
    if (userType == 'admin') {
        const sql = `
            SELECT adminName
            FROM AdminAccount
            WHERE adminID = '${adminID}'
        `;
        db.query(sql, (err, dbRes) => {
            if (err) {
                log(req, 'Error getting admin name:');
                console.log(err);
            } else {
                let adminName = dbRes.rows[0].adminname;
                let avatarSrc = '/avatars/avatar_admin.png';

                let data = { adminID, adminName, avatarSrc };
                res.render('admin-views/manage-registration.ejs', data);
            }
        });
    } else {
        res.end();
        return;
    }
})


module.exports = router;