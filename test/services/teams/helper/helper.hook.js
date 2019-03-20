const { BadRequest } = require('feathers-errors');
const mongooseService = require('feathers-mongoose');

const TYPE = ['before', 'after'];
const METHOD = ['get', 'update', 'patch', 'create', 'find', 'remove'];

const DefaultServiceOptions = {
	Model: undefined,		// maybe must added fake?
	paginate: {
		default: 10,
		max: 100,
	},
	lean: true,
};

const DefaultHeaderParams = {
	authorization: '<jwtToken>',
	host: process.env.HOST || 'localhost:3030',
	accept: 'application/json',
	'content-type': 'application/json',
	connection: 'close',
};

const isType = (type) => {
	if (TYPE.includes(type)) { return type; }
	throw BadRequest('wrong hook type');
};

const isMethod = (method) => {
	if (METHOD.includes(method)) { return method; }
	throw BadRequest('wrong hook method');
};

const isObject = (obj) => {
	if (typeof obj === 'object') { return obj; }
	throw BadRequest('Must be an object.');
};

const getService = (options = {}) => {
	const opt = Object.assign({}, DefaultServiceOptions, options);
	if (opt.Model === undefined || opt.paginate === undefined) {
		// eslint-disable-next-line no-underscore-dangle
		opt._TEST_INFO_ = 'service can not create and is faked';
		return opt;
	}
	return mongooseService(opt);
};

const patchParams = (params, account = {}) => {
	params.provider = params.provider || 'rest';
	params.query = params.query || {};
	params.authenticated = params.authenticated || true;
	params.headers = params.headers || {};
	params.payload = params.payload || { accountId: account._id || '<accountId>' };
	params.headers = params.headers || DefaultHeaderParams;
	params.account = params.account || account;
	return params;
};

/** * feathers is hook test ** */
const typeOf = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
	? obj => typeof obj
	: obj => (obj
		&& typeof Symbol === 'function'
		&& obj.constructor === Symbol
		&& obj !== Symbol.prototype ? 'symbol' : typeof obj);

function isHookObject(hookObject) {
	return (typeof hookObject === 'undefined' ? 'undefined' : typeOf(hookObject)) === 'object'
			&& typeof hookObject.method === 'string'
			&& typeof hookObject.type === 'string';
}


// todo: add service (?)
// todo: add missing params : query:Object , authenticated:true  ...etc..
/**
 *
 * @param {Object::App} app
 * @param {Object} opt
 * @param {String} opt.type
 * @param {String} opt.method
 * @param {Object} opt.params
 * @param {Object::Account} opt.account
 * @param {Object} opt.data
 * @param {Object} opt.result
 * @param {String} opt.path
 * @param {Object} opt.service want to generate a fake service and use opt.options for it, over it you can pass
 * pagination for example
 * @param {Object} opt.options {Model,paginate,lean}
 * @param {Object} opt.servicePath will search and take the service into passed app
 */
const createHook = (app, opt = {}) => {
	const type = isType(opt.type || 'before');


	const method = isMethod(opt.method || 'get');


	const params = patchParams(isObject(opt.params || {}), opt.account);


	const data = isObject(opt.data || {});


	const result = isObject(opt.result || {});


	const path = opt.servicePath || opt.path || '_TEST_PATH_';


	const service = opt.servicePath ? app.service(opt.servicePath) : opt.service || getService(opt.options);


	const hook = {
		type, method, params, path, app, service,
	};

	if (hook.type === 'after') { hook.result = result; }

	if (['create', 'patch'].includes(hook.method)) { hook.data = data; }

	if (isHookObject(hook)) { return hook; }
	throw BadRequest('Is no hook object.');
};


const createHookStack = (app, opt) => {
	const stack = {};
	TYPE.forEach((type) => {
		stack[type] = {};
		METHOD.forEach((method) => {
			stack[type][method] = createHook(app, Object.assign({ type, method }, opt));
		});
	});
	return stack;
};

module.exports = {
	createHook,
	createHookStack,
};
