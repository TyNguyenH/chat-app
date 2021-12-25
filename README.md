# Web-based chat application (Desktop/Laptop)

This is a school project from my third year in college. <br/>
The project was developed as I was learning some new stuff like Socket.IO, Express and PostgreSQL.

<br>

## Install dependencies
    npm install

<br>

## Create following files to run the app:

### .env file (required)
    HOST_PORT           {number}  // Default port
    HOST_PORT_SECURE    {number}  // Port for HTTPS
    HOST_ADDRESS        {string}  // Server main address, ex: http://ip-address or https://domain-name
    DB_HOST             {string}  // Server database host, ex: localhost
    DB_USER             {string}  // Database login user
    DB_PASSWORD         {string}  // Database login user password
    DB_PORT             {string}  // Database port


### public/js/config.js (required)
    const CONFIG = {
        serverAddress:  {string}  // Server main address, ex: http://ip-address or https://domain-name
        serverPort:     {number}  // Server main port
    };
    export default CONFIG;


### :warning: When building css with Tailwind CSS:
    $ export NODE_ENV=production  (* Linux)
    > set NODE_ENV=production     (Windows)
\* Building CSS on Linux is recommended
