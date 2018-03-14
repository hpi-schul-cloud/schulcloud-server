'use strict';

const globalHooks = require('../../../hooks');
const auth = require('@feathersjs/authentication');

exports.before = {
  all: [auth.hooks.authenticate('jwt')],
  find: [globalHooks.hasPermission('TOOL_VIEW')],
  get: [globalHooks.hasPermission('TOOL_VIEW')],
  create: [globalHooks.hasPermission('TOOL_CREATE')],
  update: [globalHooks.hasPermission('TOOL_EDIT')],
  patch: [globalHooks.hasPermission('TOOL_EDIT')],
  remove: [globalHooks.hasPermission('TOOL_CREATE')]
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
