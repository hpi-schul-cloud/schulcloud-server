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
const Sentry = require('@sentry/node');

const middleware = require('./middleware');
const sockets = require('./sockets');
const services = require('./services/');
const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const handleAutoLogout = require('./middleware/handleAutoLogout');
const requestLogger = require('./middleware/requestLogger');
const setupSwagger = require('./swagger');
const allHooks = require('./app.hooks');
const logger = require('./logger');
const versionService = require('./services/version');
const { sha } = require('./helper/version');
const { version } = require('../package.json');


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

if (process.env.SENTRY_DSN) {
	logger.info('Sentry reporting enabled using DSN', process.env.SENTRY_DSN);
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment: app.get('env'),
		release: version,
		integrations: [
			new Sentry.Integrations.Console({
				loglevel: ['warning'],
			}),
		],
	});
	Sentry.configureScope((scope) => {
		scope.setTag('frontend', false);
		scope.setLevel('warning');
		scope.setTag('domain', process.env.SC_DOMAIN || 'localhost');
		scope.setTag('sha', sha);
	});
	app.use(Sentry.Handlers.requestHandler());
	app.use(Sentry.Handlers.errorHandler());
	const removeIds = (url) => {
		const checkForHexRegExp = /^[a-f\d]{24}$/ig;
		return url.replace(checkForHexRegExp, 'ID');
	};
	app.use((req, res, next) => {
		Sentry.configureScope((scope) => {
			// todo add schoolId if logged in
			const { url, header } = req;
			scope.request = { url: removeIds(url), header };
		});
		return next();
	});
}

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
	.use(versionService)
	.use(defaultHeaders)
	.use(handleAutoLogout)
	.get('/system_info/haproxy', (req, res) => { res.send({ timestamp: new Date().getTime() }); })
	.get('/ping', (req, res) => { res.send({ message: 'pong', timestamp: new Date().getTime() }); })
	.configure(rest(handleResponseType))
	.configure(socketio())
	.configure(requestLogger)
	.use((req, res, next) => {
		// pass header into hooks.params
		req.feathers.headers = req.headers;
		next();
	})
	.configure(services)
	.configure(sockets)
	.configure(middleware)
	.configure(allHooks);

module.exports = app;
