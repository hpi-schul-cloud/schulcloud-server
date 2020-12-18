import configuration from '@feathersjs/configuration';
import express from '@feathersjs/express';
import rest from '@feathersjs/express/rest';
import feathers from '@feathersjs/feathers';
import socketio from '@feathersjs/socketio';
import { Configuration } from '@hpi-schul-cloud/commons';
import bodyParser from 'body-parser';
import compress from 'compression';
import cors from 'cors';
import { Request } from 'express';
import mongoose from 'mongoose';
import path from 'path';
import favicon from 'serve-favicon';
import { BODYPARSER_JSON_LIMIT, LEAD_TIME } from '../config/globals';
import { setupAppHooks } from './app.hooks';
import components from './components';
import setupConfiguration from './configuration';
import { Application } from './declarations';
import requestLog from './logger/RequestLogger';
import middleware from './middleware';
import defaultHeaders from './middleware/defaultHeaders';
import errorHandler from './middleware/errorHandler';
import handleResponseType from './middleware/handleReponseType';
import sentry from './middleware/sentry';
import services from './services';
import sockets from './sockets';
import setupSwagger from './swagger';
import { setupFacadeLocator } from './utils/facadeLocator';
import prometheus from './utils/prometheus';
import rabbitMq from './utils/rabbitmq';
import { initializeRedisClient } from './utils/redis';

const { ObjectId } = mongoose.Types;

async function setupApp(): Promise<Application> {
	const app: Application = express(feathers());
	app.disable('x-powered-by');

	const config = configuration();
	app.configure(config);

	if (LEAD_TIME) {
		app.use((req: Request, res, next) => {
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
}

export default setupApp();
