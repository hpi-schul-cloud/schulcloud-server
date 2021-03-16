import express from '@feathersjs/express';
import feathers from '@feathersjs/feathers';
import configuration from '@feathersjs/configuration';
import { Configuration } from '@hpi-schul-cloud/commons';
import path from 'path';
import favicon from 'serve-favicon';
import compress from 'compression';
import cors from 'cors';
// import rest from '@feathersjs/express';
import bodyParser from 'body-parser';
import socketio from '@feathersjs/socketio';

import { Types } from 'mongoose';
import { BODYPARSER_JSON_LIMIT, LEAD_TIME } from '../config/globals';

import middleware from './middleware';
import setupConfiguration from './configuration';
import sockets from './sockets';
import services from './services';
import components from './components';

import requestLog from './logger/RequestLogger';

import defaultHeaders from './middleware/defaultHeaders';
import handleResponseType from './middleware/handleReponseType';
import errorHandler from './middleware/errorHandler';
import sentry from './middleware/sentry';
import rabbitMq from './utils/rabbitmq';
import prometheus from './utils/prometheus';

import { setupFacadeLocator } from './utils/facadeLocator';
import setupSwagger from './swagger';
import { initializeRedisClient } from './utils/redis';
import { setupAppHooks } from './app.hooks';

const { rest } = express;
const { ObjectId } = Types;

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
	rabbitMq.setup();

	app
		.use(compress())
		.options('*', cors())
		.use(cors())
		.use(favicon(path.join(app.get('public'), 'favicon.ico')))
		.use('/', express.static('public'))
		.configure(setupConfiguration)
		.configure(sentry)
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
			if (req.feathers != null) {
				req.feathers.leadTime = req.leadTime;
				req.feathers.headers = req.headers;
				req.feathers.originalUrl = req.originalUrl;
			}
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

export default setupApp();
