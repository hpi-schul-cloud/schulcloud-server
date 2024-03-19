const express = require('@feathersjs/express');
const { feathers } = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const { Configuration } = require('@hpi-schul-cloud/commons');
const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const { rest } = require('@feathersjs/express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongoose').Types;

const { RequestContext } = require('@mikro-orm/core');
const { BODYPARSER_JSON_LIMIT, LEAD_TIME } = require('../config/globals');

const middleware = require('./middleware');
const setupConfiguration = require('./configuration');
const services = require('./services');
const components = require('./components');

const requestLog = require('./logger/RequestLogger');

const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const errorHandler = require('./middleware/errorHandler');
const rabbitMq = require('./utils/rabbitmq');

const { setupFacadeLocator } = require('./utils/facadeLocator');
const setupSwagger = require('./swagger');
const { initializeRedisClient } = require('./utils/redis');
const { setupAppHooks } = require('./app.hooks');

let feathersApp;

const setupApp = async (orm) => {
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

	setupFacadeLocator(app);
	setupSwagger(app);
	await initializeRedisClient();
	rabbitMq.setup(app);
	app
		.use(compress())
		.options('*', cors())
		.use(cors())
		.configure(setupConfiguration)
		.use('/helpdesk', bodyParser.json({ limit: BODYPARSER_JSON_LIMIT }))
		.use('/', bodyParser.json({ limit: '10mb' }))
		.use(bodyParser.urlencoded({ extended: true }))
		.use(bodyParser.raw({ type: () => true, limit: '10mb' }))
		.use(defaultHeaders)
		.use((req, res, next) => {
			if (orm) {
				RequestContext.create(orm.em, next);
			} else {
				next();
			}
		})
		.get('/system_info/haproxy', (req, res) => {
			res.send({ timestamp: new Date().getTime() });
		})
		.get('/ping', (req, res) => {
			res.send({ message: 'pong', timestamp: new Date().getTime() });
		})
		.configure(rest(handleResponseType))
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
	app.configure(services).configure(components).configure(middleware).configure(setupAppHooks).configure(errorHandler);

	return app;
};

module.exports = async (orm) => {
	if (feathersApp) return feathersApp;
	feathersApp = await setupApp(orm);
	return feathersApp;
};
