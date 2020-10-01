// TODO replace id generator
const shortId = require('shortid');
// const libs = ['continuation-local-storage', 'cls-hooked'];
const cls = require('cls-hooked');
const { createNamespace } = cls;

const ctx = createNamespace('ctx');

const traceId = 'trace-id';

const isValidTraceId = (id) => {
	// TODO isValid seems to be very simple
	return shortId.isValid(id);
};

const createTraceId = () => {
	return shortId.generate();
};

const requestContext = (app) => {
	app.use((req, res, next) => {
		const context = cls.getNamespace('ctx');
		// wrap events from req/res
		context.bindEmitter(req);
		context.bindEmitter(res);

		context.run(function (outerContext) {
			const id = createTraceId();
			if (traceId in outerContext) {
				// internal recursive service call
				// TODO never occurs, debug
				console.log('use outer context id:', context._set.length, outerContext.traceId, req.originalUrl);
			} else if (context.get(traceId)) {
				// TODO never occurs, debug
				console.log('use context id:', context._set.length, context.get(traceId), req.originalUrl);
			} else if (req.get(traceId)) {
				// take valid external trace id only
				if (isValidTraceId(req.get(traceId))) {
					context.set(traceId, req.get(traceId));
					console.log('req context id:', context._set.length, context.get(traceId), req.originalUrl);
				} else {
					throw new Error('bad request: header.trace-id');
				}
			} else {
				// external/new service call
				context.set(traceId, id);
				console.log('new context id:', context._set.length, context.get(traceId), req.originalUrl);
			}
			res.set(traceId, id);
			next();
		});
	});
};

const checkContext = (location) => (feathersContext) => {
	const context = cls.getNamespace('ctx');
	console.log(
		location,
		'hook context',
		context._set.length,
		context.get('trace-id'),
		feathersContext.method,
		feathersContext.path
	);
};

const getContext = () => {
	return cls.getNamespace('ctx');
};

module.exports = { requestContext, checkContext, getContext };
