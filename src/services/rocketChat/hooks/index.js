const globalHooks = require('../../../hooks');
const errors = require('@feathersjs/errors');
const logger = require('winston');
const auth = require('@feathersjs/authentication');

const blockedExtern = globalHooks.ifNotLocal((hook) => {
    logger.warn('Intern use only.');
    throw new errors.Forbidden('You have not the permission to execute this services.');
});

const rocketChatUserHooks= {
    before: {
        all: [auth.hooks.authenticate('jwt')],
        find: [],
        get: [],
        create: [hooks.disable()],
        update: [hooks.disable()],
        patch: [hooks.disable()],  
        remove: [hooks.disable()]
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],  
        remove: []
    }
}

const rocketChatLoginHooks= {
    before: {
        all: [auth.hooks.authenticate('jwt')],
        find: [hooks.disable()],
        get: [],
        create: [hooks.disable()],
        update: [hooks.disable()],
        patch: [hooks.disable()],  
        remove: [hooks.disable()]
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],  
        remove: []
    }
}

const rocketChatLogoutHooks= {
    before: {
        all: [auth.hooks.authenticate('jwt')],
        find: [hooks.disable()],
        get: [],
        create: [hooks.disable()],
        update: [hooks.disable()],
        patch: [hooks.disable()],  
        remove: [hooks.disable()]
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],  
        remove: []
    }
}

const rocketChatChannelHooks= {
    before: {
        all: [auth.hooks.authenticate('jwt')],
        find: [hooks.disable()],
        get: [],
        create: [hooks.disable()],
        update: [hooks.disable()],
        patch: [hooks.disable()],  
        remove: [hooks.disable()]
    },
    after: {
        all: [],
        find: [],
        get: [],
        create: [],
        update: [],
        patch: [],  
        remove: []
    }
}

module.exports = {rocketChatUserHooks, rocketChatLoginHooks, rocketChatLogoutHooks, rocketChatChannelHooks};