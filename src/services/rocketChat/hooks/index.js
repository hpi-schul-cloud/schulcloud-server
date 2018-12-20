const globalHooks = require('../../../hooks');
const errors = require('feathers-errors');
const logger = require('winston');
const auth = require('feathers-authentication');


/** todo replace with global hook if merged with master or remove*/
const blockedMethod = (hook) => {
    logger.warn('[teams]', 'Method is not allowed!');
    throw new errors.MethodNotAllowed('Method is not allowed!');
};

/**
 * test if id exist and id a valid moongose object id
 * @beforeHook
 * @param {Object::hook} hook 
 * @returns {Promise::hook}
 */
const existId = (hook) => {
    if (['find', 'create'].includes(hook.method)) {
        return Promise.resolve(hook);
    } else if (!hook.id) {
        throw new errors.Forbidden('Operation on this service requires an id!');
    } else {
        //todo test if valid id
        return Promise.resolve(hook);
    }
};


exports.before = {
    all: [existId, auth.hooks.authenticate('jwt')],
    find: [blockedMethod],
    get: [],
    create: [],
    update: [blockedMethod],
    patch: [blockedMethod],
    remove: [blockedMethod]
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