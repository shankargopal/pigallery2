///<reference path="../typings/main.d.ts"/>

import * as _express from 'express';
import * as _session from 'express-session';
import * as _bodyParser from 'body-parser';
import * as _debug from 'debug';
import * as _http from 'http';
import {PublicRouter} from "./routes/PublicRouter";
import {UserRouter} from "./routes/UserRouter";
import {GalleryRouter} from "./routes/GalleryRouter";
import {AdminRouter} from "./routes/AdminRouter";


export class Server {

    private debug:any;
    private app:any;
    private server:any;
    private port:number;

    constructor(){

        this.debug = _debug("PiGallery2:server");
        this.app = _express();

        if(process.env.DEBUG) {
            var _morgan = require('morgan');
            this.app.use(_morgan('dev'));
        }

        /**
         * Session above all
         */
        this.app.use(_session({
            name:"pigallery2-session",
            secret: 'PiGallery2 secret',
            cookie: {
                maxAge: 60000,
                httpOnly: false
            },
            resave: true,
            saveUninitialized: false
        }));

        /**
         * Parse parameters in POST
         */
        // for parsing application/json
        this.app.use(_bodyParser.json());

        new PublicRouter(this.app);
        new UserRouter(this.app);
        new GalleryRouter(this.app);
        new AdminRouter(this.app);

    


        // Get port from environment and store in Express.
        this.port = Server.normalizePort(process.env.PORT || '80');
        this.app.set('port', this.port);

        // Create HTTP server.
        this.server = _http.createServer(this.app);

        //Listen on provided port, on all network interfaces.
        this.server.listen(this.port);
        this.server.on('error', this.onError);
        this.server.on('listening', this.onListening);


    }


    /**
     * Normalize a port into a number, string, or false.
     */
    private static normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */
    private onError = (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof this.port === 'string'
            ? 'Pipe ' + this.port
            : 'Port ' + this.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    };


    /**
     * Event listener for HTTP server "listening" event.
     */
    private onListening = () => {
        var addr = this.server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        this.debug('Listening on ' + bind);
    };

}



if(process.env.DEBUG) {
    console.log("Running in DEBUG mode");
}

new Server();