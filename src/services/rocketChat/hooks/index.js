const globalHooks = require('../../../hooks');
const errors = require('feathers-errors');
const logger = require('winston');


const blockedExtern = globalHooks.ifNotLocal((hook) => {
    logger.warn('Intern use only.');
    throw new errors.Forbidden('You have not the permission to execute this services.');
});
    

exports.before = {
    all: [],       //todo add if finish blockedExtern
    find: [],
    get: [],
    create: [],
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