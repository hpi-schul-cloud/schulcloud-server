'use strict';

const path = require('path');
const express = require('@feathersjs/express');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const socketio = require('@feathersjs/socketio');
const middleware = require('./middleware');
const services = require('./services');
const winston = require('winston');
const defaultHeaders = require('./middleware/defaultHeaders');
const setupSwagger = require('./swagger');
const prettyError = require('pretty-error').start();
const allHooks = require('./app.hooks');

require('console-stamp')(console);
require('console-stamp')(winston );

let secrets;
try {
	(process.env.NODE_ENV === 'production') ? secrets = require('../config/secrets.js') : secrets = require('../config/secrets.json');
} catch(error) {
	secrets = {};
}

const app = express(feathers());

app.configure(configuration(path.join(__dirname, '..')));
setupSwagger(app);

app.set("secrets", secrets);

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', express.static(app.get('public')))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({extended: true}))

	.use(defaultHeaders)
	.get('/system_info/haproxy', (req, res) => { res.send({ "timestamp":new Date().getTime() });})
	.get('/ping', (req, res) => { res.send({ "message":"pong","timestamp":new Date().getTime() });})
	.configure(rest())
	.configure(socketio())

	// auth is setup in /authentication/

	.configure(services)
	.configure(middleware)
	.hooks(allHooks);

winston.cli();	// optimize for cli, like using colors
winston.level = 'debug';

module.exports = app;
