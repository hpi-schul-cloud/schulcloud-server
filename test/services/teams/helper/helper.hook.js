const { BadRequest } = require('feathers-errors');

const _TYPE = ['before', 'after'];
const _METHOD = ['get', 'update', 'patch', 'create', 'find', 'remove'];

const isType = (type) => {
	if (_TYPE.includes(type)) 
		return type;
	throw BadRequest('wrong hook type');
};

const isMethod = (method) => {
	if (_METHOD.includes(method)) 
		return method;
	throw BadRequest('wrong hook method');
};

const isObject = (obj) => {
	if (typeof obj === 'object') 
		return obj;
	throw BadRequest('Must be an object.');	
};

const patchParams = (params) => {
	if (params.provider === undefined)
		params.provider = 'rest';
	return params;
};

/*** feathers is hook test ***/
var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ?
	function (obj) {
		return typeof obj;
	} :
	function (obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

function isHookObject(hookObject) {
	return (typeof hookObject === 'undefined' ? 'undefined' : _typeof(hookObject)) === 'object' && typeof hookObject.method === 'string' && typeof hookObject.type === 'string';
}


const createHook = (opt={}) => {
	let type=isType(opt.type || 'before'), 
		method=isMethod(opt.method || 'get'), 
		params=patchParams(isObject(opt.params || {})), 
		data=isObject(opt.data || {}), 
		result=isObject(opt.result||{});

	let hook = {type,method,params};

	if (hook.type === 'after') 
		hook.result = result;

	if (['create', 'patch'].includes(hook.method)) 
		hook.data = data;

	if( isHookObject(hook) )
		return hook; 
	else
		throw BadRequest('Is no hook object.');
};


const createHookStack = ({params,data,result})=>{
	let stack = {};
	_TYPE.forEach(type=>{
		stack[type]={};
		_METHOD.forEach(method=>{
			stack[type][method]=createHook({
				type,
				method,
				params,
				data,
				result
			});
		});
	});
	return stack;
};

module.exports = {
	createHook, 
	createHookStack
};