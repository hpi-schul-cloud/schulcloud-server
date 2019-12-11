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
const delay = require('delay');
const { ObjectId } = require('mongoose').Types;

const middleware = require('./middleware');
const sockets = require('./sockets');
const services = require('./services/');

const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const sentry = require('./middleware/sentry');

const setupSwagger = require('./swagger');
const allHooks = require('./app.hooks');
const versionService = require('./services/version');

const app = express(feathers());
const config = configuration();

app.configure(config);
setupSwagger(app);

// set custom response header for ha proxy
if (process.env.KEEP_ALIVE) {
	app.use((req, res, next) => {
		res.setHeader('Connection', 'Keep-Alive');
		next();
	});
}

function getRandomInt(max) {
	return Math.floor(Math.random() * Math.floor(max));
}

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', express.static('public'))
	.configure(sentry)
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.raw({ type: () => true, limit: '10mb' }))
	.use(versionService)
	.use(defaultHeaders)
	.get('/testrun', async (req, res, next) => {
		const t1 = Date.now();
		await delay(5000 + getRandomInt(0));
		const t2 = Date.now();
		const response = {
			t1,
			t2,
			delta: t2 - t1,
			hallo: 'server',
		};
		// console.log(response);
		res.json(response);
	})
	.get('/system_info/haproxy', (req, res) => { res.send({ timestamp: new Date().getTime() }); })
	.get('/ping', (req, res) => { res.send({ message: 'pong', timestamp: new Date().getTime() }); })
	.configure(rest(handleResponseType))
	.configure(socketio())
	.configure(requestLogger)
	.use((req, res, next) => {
		// pass header into hooks.params
		// todo: To create a fake requestId on this place is a temporary solution
		// it MUST be removed after the API gateway is established
		const uid = ObjectId();
		req.headers.requestId = uid.toString();

		req.feathers.headers = req.headers;
		next();
	})
	.configure(services)
	.configure(sockets)
	.configure(middleware)
	.configure(allHooks)
	.configure(errorHandler);

module.exports = app;
