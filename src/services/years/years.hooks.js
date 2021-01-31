const { authenticate } = require('@feathersjs/authentication');
const { disallow } = require('feathers-hooks-common');
const { ifNotLocal } = require('../../hooks');

module.exports = {
    before: {
        all: [ifNotLocal(authenticate('jwt'))],
        find: [],
        create: [],
        update: [],
        get: [],
        patch: [],
        remove: [disallow()],
    },
    after: {
        all: [],
        find: [],
        create: [],
        update: [],
        get: [],
        patch: [],
        remove: [],
    },
};
