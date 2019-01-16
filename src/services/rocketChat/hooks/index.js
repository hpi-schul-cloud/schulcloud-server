const globalHooks = require('../../../hooks');
const errors = require('feathers-errors');
const logger = require('winston');
const auth = require('feathers-authentication');
const hooks = require('feathers-hooks')

const blockedExtern = globalHooks.ifNotLocal((hook) => {
    logger.warn('Intern use only.');
    throw new errors.Forbidden('You have not the permission to execute this services.');
});
    
rocketChatUserHooks= {
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

rocketChatLoginHooks= {
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

rocketChatLogoutHooks= {
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

rocketChatChannelHooks= {
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