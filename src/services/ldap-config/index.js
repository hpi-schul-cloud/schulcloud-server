const LdapConfigService = require('./service');
const LdapConfigServiceHooks = require('./hooks');

module.exports = (app) => {
	app.use('/legacy/v1/ldap-config', new LdapConfigService());
	const systemService = app.service('/legacy/v1/ldap-config');
	systemService.hooks(LdapConfigServiceHooks);
};
