# Web-based chat application (Desktop/Laptop)

<br>

## .env file (required)
    HOST_PORT           {number}  // Default port
    HOST_PORT_SECURE    {number}  // Port for HTTPS
    HOST_ADDRESS        {string}  // Server main address, ex: http://ip-address or https://domain-name
    DB_HOST             {string}  // Server database host, ex: localhost
    DB_USER             {string}  // Database login user
    DB_PASSWORD         {string}  // Database login user password
    DB_PORT             {string}  // Database port

<br>

## public/js/config.js (required)
    const CONFIG = {
        serverAddress:  {string}  // Server main address, ex: https://domain-name or http://<ip-address>
        serverPort:     {number}  // Server main port
    };
    export default CONFIG;