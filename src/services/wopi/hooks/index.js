'use strict';

const errors = require('feathers-errors');
const auth = require('feathers-authentication');

/**
 * handles the authentication for wopi-clients, the wopi-specific param 'access-token' has to be a valid jwt for the current system
 * 
 * Excerpt from official documentation: http://wopi.readthedocs.io/projects/wopirest/en/latest/concepts.html
 * "Note that WOPI clients are not required to pass the access token in the Authorization header, but they must send it as a URL parameter in all WOPI operations. 
 * Thus, for maximum compatibility, WOPI hosts should either use the URL parameter in all cases, or fall back to it if the Authorization header is not included 
 * in the request."
 * @param {*} hook 
 */
const wopiAuthentication = hook => {
  hook.params.headers = hook.params.headers || {};
  let jwt = hook.params.headers.authorization || (hook.params.query || {}).access_token; // depends on client
  if (!jwt) throw new Error('access_token is missing!');
  
  hook.params.headers.authorization = jwt;

  return auth.hooks.authenticate('jwt')(hook);
};

/**
 * All editing (POST, PATCH, DELETE) actions should include the wopi-override header!
 */
const retrieveWopiOverrideHeader = hook => {
  if (!hook.params.headers['x-wopi-override']) throw new errors.BadRequest("X-WOPI-Override header was not provided or was empty!");
  hook.params.wopiAction = hook.params.headers['x-wopi-override'];
  return hook;
};

exports.before = {
		all: [wopiAuthentication],
		find: [],
		get: [],
		create: [retrieveWopiOverrideHeader],
		update: [retrieveWopiOverrideHeader],
		patch: [retrieveWopiOverrideHeader],
		remove: [retrieveWopiOverrideHeader]
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
