const express = require('@feathersjs/express');
const feathers = require('@feathersjs/feathers');
const configuration = require('@feathersjs/configuration');
const apiMetrics = require('prometheus-api-metrics');
const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const rest = require('@feathersjs/express/rest');
const bodyParser = require('body-parser');
const socketio = require('@feathersjs/socketio');
const { ObjectId } = require('mongoose').Types;
const Sentry = require('@sentry/node');

const { KEEP_ALIVE, BODYPARSER_JSON_LIMIT, METRICS_PATH, SC_DOMAIN } = require('../config/globals');

const middleware = require('./middleware');
const sockets = require('./sockets');
const services = require('./services');

const defaultHeaders = require('./middleware/defaultHeaders');
const handleResponseType = require('./middleware/handleReponseType');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const sentry = require('./middleware/sentry');
const { Configuration } = require('@schul-cloud/commons');
const rabbitMq = require('./utils/rabbitmq');

const setupSwagger = require('./swagger');
const { initializeRedisClient } = require('./utils/redis');
const { setupAppHooks } = require('./app.hooks');
const versionService = require('./services/version');
const { version } = require('../package.json');
const { sha } = require('./helper/version');
const logger = require('./helper/logger');

const app = express(feathers());

if (Configuration.has('SENTRY_DSN')) {
	Sentry.init({
		dsn: Configuration.get('SENTRY_DSN'),
		environment: app.get('env'),
		release: version,
		sampleRate: Configuration.get('SENTRY_SAMPLE_RATE'),
	});
	Sentry.configureScope((scope) => {
		scope.setTag('frontend', false);
		scope.setLevel('warning');
		scope.setTag('domain', SC_DOMAIN);
		scope.setTag('sha', sha);
	});
	app.use(Sentry.Handlers.requestHandler());
}

const config = configuration();
app.configure(config);

const metricsOptions = {};
if (METRICS_PATH) {
	metricsOptions.metricsPath = METRICS_PATH;
}
app.use(apiMetrics(metricsOptions));

setupSwagger(app);
initializeRedisClient();
rabbitMq.setup(app);

// set custom response header for ha proxy
if (KEEP_ALIVE) {
	app.use((req, res, next) => {
		res.setHeader('Connection', 'Keep-Alive');
		next();
	});
}

function removeIds(url) {
	const checkForHexRegExp = /[a-f\d]{24}/ig;
	return url.replace(checkForHexRegExp, 'ID');
}

app.use(compress())
	.options('*', cors())
	.use(cors())
	.use(favicon(path.join(app.get('public'), 'favicon.ico')))
	.use('/', express.static('public'))
	.configure(sentry)
	.use('/helpdesk', bodyParser.json({ limit: BODYPARSER_JSON_LIMIT }))
	.use('/', bodyParser.json())
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
		if (Configuration.has('SENTRY_DSN')) {
			Sentry.configureScope((scope) => {
				if (res.locals.currentUser) {
					scope.setTag({ schoolId: res.locals.currentUser.schoolId });
				}
				const { url, header } = req;
				scope.request = { url: removeIds(url), header };
			});
		}
		next();
	})
	.configure(services)
	.configure(sockets)
	.configure(middleware)
	.configure(setupAppHooks)
	.configure(errorHandler);

// sentry error handler
app.use(Sentry.Handlers.errorHandler());

// error handlers

app.use((err, req, res, next) => {
	// set locals, only providing error in development
	const status = err.status || err.statusCode || 500;
	if (err.statusCode && err.error) {
		res.setHeader('error-message', err.error.message);
		res.locals.message = err.error.message;
	} else {
		res.locals.message = err.message;
	}

	if (res.locals && res.locals.message && res.locals.message.includes('ESOCKETTIMEDOUT') && err.options) {
		const message = `ESOCKETTIMEDOUT by route: ${err.options.baseUrl + err.options.uri}`;
		logger.warn(message);
		Sentry.captureMessage(message);
		res.locals.message = 'Es ist ein Fehler aufgetreten. Bitte versuche es erneut.';
	}

	res.locals.error = req.app.get('env') === 'development' ? err : { status };
	if (err.error) logger.error(err.error);
	if (res.locals.currentUser) res.locals.loggedin = true;
	// render the error page
	res.status(status).render('lib/error', {
		loggedin: res.locals.loggedin,
		inline: res.locals.inline ? true : !res.locals.loggedin,
	});
});

module.exports = app;
