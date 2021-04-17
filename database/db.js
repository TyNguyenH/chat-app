require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'chatapp',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
client.connect();

module.exports = {
    query: (text, callback) => {
        return client.query(text, callback);
    },

    async asyncQuery (text) {
        const res = await client.query(text);
        return res;
    }
}
