'use strict';

const {isAdmin, ifNotLocal} = require('../../../hooks');
const hooks = require('feathers-hooks');
const auth = require('feathers-authentication').hooks;

exports.before = {
  all: [
    auth.verifyToken(),
    auth.populateUser(),
    auth.restrictToAuthenticated()
  ],
  find: [],
  get: [],
  create: [ifNotLocal(isAdmin())],
  update: [ifNotLocal(isAdmin())],
  patch: [ifNotLocal(isAdmin())],
  remove: [ifNotLocal(isAdmin())]
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
