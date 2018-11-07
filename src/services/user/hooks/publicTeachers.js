'use strict';

const globalHooks = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication');

const mapRoleFilterQuery = (hook) => {
    if (hook.params.query.roles) {
        let rolesFilter = hook.params.query.roles;
        hook.params.query.roles = {};
        hook.params.query.roles.$in = rolesFilter;
    }

    return Promise.resolve(hook);
};

const filterForPublicTeacher = (hook) => {
    //hook.params.query.discoverable = true;

    return Promise.resolve(hook);
};

exports.before = {
    all: [],
    find: [
        globalHooks.mapPaginationQuery.bind(this),
        globalHooks.resolveToIds.bind(this, '/roles', 'params.query.roles', 'name'),	// resolve ids for role strings (e.g. 'TEACHER')
        auth.hooks.authenticate('jwt'),
        filterForPublicTeacher,
        mapRoleFilterQuery
    ],
    get: [auth.hooks.authenticate('jwt')],
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