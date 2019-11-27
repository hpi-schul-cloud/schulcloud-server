const Sentry = require('@sentry/node');
const { sha } = require('../helper/version');
const { version } = require('../../package.json');

/**
 * helpers
 */
const replaceIds = (string) => {
	if (string) {
		return string.replace(/[a-f\d]{24}/ig, '[id]');
	}
	return string;
};

/**
 * Middlewares
 * @param {SentryEvent} event
 * @param {Object(event_id, originalException, syntheticException)} hint
 * @param {FeatherApp} app
 * @returns {SentryEvent || undefined} Return modified sentry event, or undefined to skip sending event
 */
const removeIdMiddleware = (event) => {
	// eslint-disable-next-line camelcase
	const { request: { data, url, query_string } } = event;

	event.request.data = replaceIds(data);
	event.request.url = replaceIds(url);
	event.request.query_string = replaceIds(query_string);
	return event;
};

const removeJwtToken = (event) => {
	delete event.request.headers.authorization;
	return event;
};

const logItMiddleware = (event, hint, app) => {
	app.logger.info(
		`If you not in development mode, the error is send on this point to sentry!
		Please note if you want to test if message is go to sentry disable this middleware.`
	);
	return event;
};

const filterByErrorCodesMiddleware = (...errorCode) => (event, hint, app) => {
	if (errorCode.includes(hint.originalException.code)) {
		return undefined;
	}
	return event;
};

const filterByErrorMessageMiddleware = (...errorMessage) => (event, hint, app) => {
	if (errorMessage.includes(hint.originalException.message)) {
		return undefined;
	}
	return event;
};

const skipItMiddleware = () => undefined;

module.exports = (app) => {
	const dsn = process.env.SENTRY_DSN;
	const environment = app.get('env');
	const release = version;

	if (dsn) {
		// middleware to modified events that, are post to sentry
		let middleware = [
			filterByErrorCodesMiddleware(404),
			filterByErrorMessageMiddleware('could not initialize rocketchat user'),
			removeIdMiddleware,
			removeJwtToken,
		];
		// for local test runs, post feedback but skip it
		if (environment === 'development') {
			middleware.push(logItMiddleware);
			middleware.push(skipItMiddleware);
		}
		// do not execute for test runs
		if (environment === 'test') {
			middleware = [skipItMiddleware];
		}

		const runMiddlewares = (event, hint, index = 0) => {
			if (event === undefined) {
				return undefined;
			}

			if (middleware.length === index) {
				return event;
			}

			const modifiedEvent = middleware[index](event, hint, app);
			return runMiddlewares(modifiedEvent, hint, index + 1);
		};

		Sentry.init({
			dsn,
			environment,
			release,
			integrations: [
				new Sentry.Integrations.Console({}),
			],
			beforeSend(event, hint) {
				return runMiddlewares(event, hint);
			},
		});

		Sentry.configureScope((scope) => {
			scope.setTag('frontend', false);
			scope.setLevel('warning');
			scope.setTag('domain', process.env.SC_DOMAIN || 'localhost');
			scope.setTag('sha', sha);
		});

		app.use(Sentry.Handlers.requestHandler());
	}
};
