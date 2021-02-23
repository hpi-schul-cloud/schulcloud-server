const Sentry = require('@sentry/node');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { sha } = require('../helper/version');
const { version } = require('../../package.json');

const { SC_DOMAIN, NODE_ENV, ENVIRONMENTS } = require('../../config/globals');
/**
 * helpers
 */
const replaceIds = (string) => {
	if (string) {
		return string.replace(/[a-f\d]{24}/gi, '__id__');
	}
	return string;
};

/**
 * Middlewares
 * @param {SentryEvent} event
 * @param {Object(event_id, originalException, syntheticException)} hint
 * @param {FeatherApp} app
 * @returns {SentryEvent || null} Return modified sentry event, or undefined to skip sending event
 */
const removeIdMiddleware = (event) => {
	if (event && event.request) {
		// eslint-disable-next-line camelcase
		const {
			request: { data, url, query_string },
		} = event;
		if (data) {
			event.request.data = replaceIds(data);
		}
		if (url) {
			event.request.url = replaceIds(url);
		}
		// eslint-disable-next-line camelcase
		if (query_string) {
			event.request.query_string = replaceIds(query_string);
		}
	}
	return event;
};

const removeJwtToken = (event) => {
	if (event && event.request && event.request.headers && event.request.headers.authorization) {
		delete event.request.headers.authorization;
	}
	return event;
};

const logItMiddleware = (sendToSentry = false) => (event, hint, app) => {
	app.logger.info(
		'If you are not in default mode, the error is sent to sentry at this point! ' +
			'If you actually want to send a real request to sentry, please modify sendToSentry.'
	);
	return sendToSentry ? event : null;
};

const filterByErrorCodesMiddleware = (...errorCode) => (event, hint, app) => {
	const code = hint.originalException.code || hint.originalException.statusCode;
	if (errorCode.includes(code)) {
		return null;
	}
	return event;
};
/*
const filterByErrorMessageMiddleware = (...errorMessage) => (event, hint, app) => {
	if (errorMessage.includes(hint.originalException.message)) {
		return null;
	}
	return event;
};
*/
const skipItMiddleware = () => null;

module.exports = (app) => {
	const release = version;

	if (Configuration.has('SENTRY_DSN')) {
		// middleware to modified events that, are post to sentry
		let middlewares = [
			filterByErrorCodesMiddleware(404),
			// filterByErrorMessageMiddleware('could not initialize rocketchat user'),
			removeIdMiddleware,
			removeJwtToken,
		];
		// for local test runs, post feedback but skip it
		if (NODE_ENV === ENVIRONMENTS.DEVELOPMENT) {
			middlewares.push(logItMiddleware(false));
		}
		// do not execute for test runs
		if (NODE_ENV === ENVIRONMENTS.TEST) {
			middlewares = [skipItMiddleware];
		}

		const runMiddlewares = (event, hint) => {
			let modifiedEvent = event; // is no copy, event is also mutated

			for (let i = 0; i < middlewares.length; i += 1) {
				if (!modifiedEvent) {
					// if skip return
					return modifiedEvent;
				}
				modifiedEvent = middlewares[i](modifiedEvent, hint, app);
			}
			return modifiedEvent;
		};

		Sentry.init({
			dsn: Configuration.get('SENTRY_DSN'),
			environment: NODE_ENV,
			release,
			//	debug: true,
			sampleRate: Configuration.get('SENTRY_SAMPLE_RATE'),
			beforeSend(event, hint) {
				const modifiedEvent = runMiddlewares(event, hint);
				return modifiedEvent;
			},
		});

		Sentry.configureScope((scope) => {
			scope.setTag('frontend', false);
			scope.setLevel('warning');
			scope.setTag('domain', SC_DOMAIN);
			scope.setTag('sha', sha);
		});

		app.use(Sentry.Handlers.requestHandler());
	}
};
