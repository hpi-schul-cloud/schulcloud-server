const { AsyncLocalStorage } = require('async_hooks');
const { ObjectId } = require('mongoose').Types;

// requires Node.js 14
const asyncLocalStorage = new AsyncLocalStorage();

const CONSTANTS = {
	TRACE_ID: 'traceId',
	SPAWN_ID: 'spawnId',
};

const isValidId = (id) => {
	return ObjectId.isValid(id);
};

const createId = () => {
	return ObjectId().toString();
};
/**
 * @returns {Map<T>|undefined} returns current context map or undefined
 */
const getContext = () => {
	const store = asyncLocalStorage.getStore();
	return store;
};

/**
 * returns the current config map property by key or undefined
 * @param {string} key
 * @returns {T|undefined}
 */
const getContextValue = (key) => {
	const store = getContext();
	if (store !== undefined) {
		return store.get(key);
	}
	return undefined;
};

const getContextDepth = () => {
	return getContextValue('__depth') || 0;
};

const createDefaultContext = ({ traceId = createId(), spawnId = createId(), initiator = 'DEFAULT' }) => {
	const context = new Map(Object.entries({ traceId, spawnId, initiator, __depth: getContextDepth() }));
	return context;
};

/**
 * Initializes an context object which can be retieved later via getContext.
 * @param {T} context Object to be assigned as context
 * @param {string} context.traceId context should contain a trace id
 * @param {*} callback next middleware
 */
const runContext = (contextOptions, callback) => {
	const context = createDefaultContext(contextOptions);
	asyncLocalStorage.run(context, callback);
};
/**
 * Set a value inside the current context map.
 * @param {string|T} key
 * @param {T} value
 */
const setContextValue = (key, value) => {
	const store = getContext();
	if (store !== undefined) {
		return store.set(key, value);
	}
	return undefined;
};

/**
 * initializes a new context through middleware, defines a context with request-/spawn-id defined.
 * @param req.headers.traceId {ObjectId} request-id will be used as context traceId if properly defined otherwise this value will be updated
 */
const requestContext = (req, res, next) => {
	const initiator = 'REST';
	let traceId = null;
	if (req.get(CONSTANTS.TRACE_ID) && isValidId(req.get(CONSTANTS.TRACE_ID))) {
		// fetch traceId from request
		traceId = req.get(CONSTANTS.TRACE_ID);
	} else {
		traceId = createId();
	}
	res.header(CONSTANTS.TRACE_ID, traceId);
	// set spawnId internally only
	const spawnId = createId();
	res.header(CONSTANTS.SPAWN_ID, spawnId);
	const context = createDefaultContext({ traceId, spawnId, initiator });
	runContext(context, next);
};

/**
 * returns tracing information
 * @returns {uuid} {traceId, spawnId}
 */
const getTrace = () => {
	return {
		traceId: getContextValue(CONSTANTS.TRACE_ID),
		spawnId: getContextValue(CONSTANTS.SPAWN_ID),
	};
};

module.exports = {
	requestContext,
	runContext,
	getContext,
	getContextValue,
	setContextValue,
	getTrace,
	CONSTANTS,
};
