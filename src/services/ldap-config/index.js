const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const LdapConfigService = require('./service');
const LdapConfigServiceHooks = require('./hooks');

module.exports = (app) => {
	app.use('/ldap-config/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/ldap-config', new LdapConfigService());
	const systemService = app.service('/ldap-config');
	systemService.hooks(LdapConfigServiceHooks);
};
