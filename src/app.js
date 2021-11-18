const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const socketio = require('@feathersjs/socketio');
const { ObjectId } = require('mongoose').Types;

const { BODYPARSER_JSON_LIMIT, LEAD_TIME } = require('../config/globals');

const middleware = require('./middleware');
const setupConfiguration = require('./configuration');
const sockets = require('./sockets');
const services = require('./services');
const components = require('./components');

const requestLog = require('./logger/RequestLogger');

const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const errorHandler = require('./middleware/errorHandler');
// const sentry = require('./middleware/sentry');
const rabbitMq = require('./utils/rabbitmq');
const prometheus = require('./utils/prometheus');

const { setupFacadeLocator } = require('./utils/facadeLocator');
const setupSwagger = require('./swagger');
const { initializeRedisClient } = require('./utils/redis');
const { setupAppHooks } = require('./app.hooks');

const setupApp = async () => {
	const app = express(feathers());
	app.disable('x-powered-by');

	const config = configuration();
	app.configure(config);

	if (LEAD_TIME) {
		app.use((req, res, next) => {
			req.leadTime = Date.now();
			next();
		});
	}

	app.configure(prometheus);

	setupFacadeLocator(app);
	setupSwagger(app);
	initializeRedisClient();
	rabbitMq.setup(app);

	app
		.use(compress())
		.options('*', cors())
		.use(cors())
		.use(favicon(path.join(app.get('public'), 'favicon.ico')))
		.use('/', express.static('public'))
		.configure(setupConfiguration)
		//	.configure(sentry)
		.use('/helpdesk', bodyParser.json({ limit: BODYPARSER_JSON_LIMIT }))
		.use('/', bodyParser.json({ limit: '10mb' }))
		.use(bodyParser.urlencoded({ extended: true }))
		.use(bodyParser.raw({ type: () => true, limit: '10mb' }))
		.use(defaultHeaders)
		.get('/system_info/haproxy', (req, res) => {
			res.send({ timestamp: new Date().getTime() });
		})
		.get('/ping', (req, res) => {
			res.send({ message: 'pong', timestamp: new Date().getTime() });
		})
		.configure(rest(handleResponseType))
		.configure(socketio())
		.use((req, res, next) => {
			// pass header into hooks.params
			// todo: To create a fake requestId on this place is a temporary solution
			// it MUST be removed after the API gateway is established
			const uid = ObjectId();
			req.headers.requestId = uid.toString();
			req.feathers.leadTime = req.leadTime;
			req.feathers.headers = req.headers;
			req.feathers.originalUrl = req.originalUrl;
			next();
		});

	if (Configuration.get('REQUEST_LOGGING_ENABLED') === true) {
		app.use((req, res, next) => {
			requestLog(`${req.method} ${req.originalUrl}`);
			next();
		});
	}
	app
		.configure(services)
		.configure(components)
		.configure(sockets)
		.configure(middleware)
		.configure(setupAppHooks)
		.configure(errorHandler);

	return app;
};

module.exports = setupApp();
