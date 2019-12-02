const path = require('path');
const express = require('@feathersjs/express');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const commons = require('@schul-cloud/commons');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const socketio = require('@feathersjs/socketio');
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
const Configuration = new commons.Configuration();

app.configure(config);
Configuration.init(app);
setupSwagger(app);

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
	.configure(sentry)
	.use(bodyParser.json())
	.use(bodyParser.urlencoded({ extended: true }))
	.use(bodyParser.raw({ type: () => true, limit: '10mb' }))
	.use(versionService)
	.use(defaultHeaders)
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
