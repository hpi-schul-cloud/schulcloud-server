const UniventionLDAPStrategy = require('./univention');
const GeneralLDAPStrategy = require('./general');
const IservIdmLDAPStrategy = require('./iserv-idm');

const strategies = {
	univention: UniventionLDAPStrategy,
	'iserv-idm': IservIdmLDAPStrategy,
	general: GeneralLDAPStrategy,
};

/**
 * returns the LDAPStrategy object referenced by the given LDAP config's
 * `provider` attribute
 * @param {App} app
 * @param {LdapConfig} config
 * @return {AbstractLDAPStrategy} an LDAPStrategy object
 * @throws Will throw an error if the given config is invalid or if there is no
 * strategy implemented for the referenced provider
 */
module.exports = function determineStrategy(app, config) {
	if (config && config.provider && strategies[config.provider]) {
		const LDAPStrategy = strategies[config.provider];
		return new LDAPStrategy(app, config);
	}
	throw new Error('Invalid configuration object');
};
