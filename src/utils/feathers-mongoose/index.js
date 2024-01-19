/*
This is a port of the deprecated feathers-mongoose module to work with the new feathers version 5.
Codebase clone from https://github.com/feathersjs-ecosystem/feathers-mongoose
*/
const hooks = require('./hooks');
const service = require('./service');

Object.assign(service, { hooks, service });

module.exports = service;
