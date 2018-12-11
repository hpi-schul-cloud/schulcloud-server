const globalHooks = require('../../../hooks');
const errors = require('feathers-errors');
const logger = require('winston');
const auth = require('feathers-authentication');

const checkJwt = () => {
	return function (hook) {
		if (((hook.params||{}).headers||{}).authorization != undefined) {
			return (auth.hooks.authenticate('jwt')).call(this, hook);
		} else {
			return Promise.resolve(hook);
		}
	};
};
    

exports.before = {
    all: [],       //todo add if finish blockedExtern
    find: [checkJwt()],
    get: [],
    create: [checkJwt()],
    update: [],
    patch: [],  
    remove: []
};

exports.after = {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],  
    remove: []
};
