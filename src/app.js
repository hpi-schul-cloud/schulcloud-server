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
const winston = require('winston');
const middleware = require('./middleware');
const sockets = require('./sockets');
const services = require('./services/');
const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const setupSwagger = require('./swagger');
const allHooks = require('./app.hooks');

require('console-stamp')(console);
require('console-stamp')(winston);

let secrets;
try {
	if (['production', 'lokal'].includes(process.env.NODE_ENV)) {
		// eslint-disable-next-line global-require
		secrets = require('../config/secrets.js');
	} else {
		// eslint-disable-next-line global-require
		secrets = require('../config/secrets.json');
	}
} catch (error) {
	secrets = {};
}

const app = express(feathers());
const config = configuration();

app.configure(config);
setupSwagger(app);

app.set('secrets', secrets);

// set custom response header for ha proxy
if (process.env.KEEP_ALIVE) {
	app.use((req, res, next) => {
		res.setHeader('Connection', 'Keep-Alive');
		next();
	});
}

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', express.static('public'))
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.raw({ type: () => true, limit: '10mb' }))

	.use(defaultHeaders)
	.get('/system_info/haproxy', (req, res) => { res.send({ timestamp: new Date().getTime() }); })
	.get('/ping', (req, res) => { res.send({ message: 'pong', timestamp: new Date().getTime() }); })
	.configure(rest(handleResponseType))
	.configure(socketio())

	.use((req, res, next) => {
		// pass header into hooks.params
		req.feathers.headers = req.headers;
		next();
	})
	.configure(services)

	.configure(socketio())
	.configure(sockets)
	.configure(middleware)
	.hooks(allHooks);

winston.cli(); // optimize for cli, like using colors
winston.level = 'debug';

module.exports = app;
