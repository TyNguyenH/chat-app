require('dotenv').config();
const { Pool } = require('pg');


const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'chatapp',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});


module.exports = {
    query: (text, callback) => {
        return pool.query(text, callback);
    },

    asyncQuery: async (text) => {
        const res = await pool.query(text);
        return res;
    }
}