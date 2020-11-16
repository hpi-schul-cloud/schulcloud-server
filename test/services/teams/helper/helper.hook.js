const service = require('feathers-mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

const HOST = Configuration.get('HOST');
const _TYPE = ['before', 'after'];
const _METHOD = ['get', 'update', 'patch', 'create', 'find', 'remove'];

const _DefaultServiceOptions = {
	Model: undefined, // maybe must added fake?
	paginate: {
		default: 10,
		max: 100,
	},
	lean: true,
};

const _DefaultHeaderParams = {
	authorization: '<jwtToken>',
	host: HOST,
	accept: 'application/json',
	'content-type': 'application/json',
	connection: 'close',
};

const isType = (type) => {
	if (_TYPE.includes(type)) return type;
	throw BadRequest('wrong hook type');
};

const isMethod = (method) => {
	if (_METHOD.includes(method)) return method;
	throw BadRequest('wrong hook method');
};

const isObject = (obj) => {
	if (typeof obj === 'object') return obj;
	throw BadRequest('Must be an object.');
};

const getService = (options = {}) => {
	const opt = { ..._DefaultServiceOptions, ...options };
	if (opt.Model === undefined || opt.paginate === undefined) {
		opt._TEST_INFO_ = 'service can not create and is faked';
		return opt;
	}
	return service(opt);
};

const patchParams = (params, account = {}) => {
	params.provider = params.provider || 'rest';
	params.query = params.query || {};
	params.authenticated = params.authenticated || true;
	params.headers = params.headers || {};
	params.payload = params.payload || { accountId: account._id || '<accountId>' };
	params.headers = params.headers || _DefaultHeaderParams;
	params.account = params.account || account;
	return params;
};

/** * feathers is hook test ** */
const _typeof =
	typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol'
		? function (obj) {
				return typeof obj;
		  }
		: function (obj) {
				return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
					? 'symbol'
					: typeof obj;
		  };

function isHookObject(hookObject) {
	return (
		(typeof hookObject === 'undefined' ? 'undefined' : _typeof(hookObject)) === 'object' &&
		typeof hookObject.method === 'string' &&
		typeof hookObject.type === 'string'
	);
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
 * @param {Object} opt.service want to generate a fake service and use opt.options for it, over it you can pass pagination for example
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
		type,
		method,
		params,
		path,
		app,
		service,
	};

	if (hook.type === 'after') hook.result = result;

	if (['create', 'patch'].includes(hook.method)) hook.data = data;

	if (isHookObject(hook)) return hook;
	throw BadRequest('Is no hook object.');
};

const createHookStack = (app, opt) => {
	const stack = {};
	_TYPE.forEach((type) => {
		stack[type] = {};
		_METHOD.forEach((method) => {
			stack[type][method] = createHook(app, { type, method, ...opt });
		});
	});
	return stack;
};

module.exports = {
	createHook,
	createHookStack,
};
