const { static: staticContent } = require('@feathersjs/express');
const path = require('path');
const reqlib = require('app-root-path').require;

const LdapConfigService = require('./service');
const LdapConfigServiceHooks = require('./hooks');

const { registerApiValidation } = reqlib('src/utils/apiValidation');

module.exports = (app) => {
	registerApiValidation(app, path.join(__dirname, '/docs/openapi.yaml'));
	app.use('/ldap-config/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/ldap-config', new LdapConfigService());
	const systemService = app.service('/ldap-config');
	systemService.hooks(LdapConfigServiceHooks);
};
