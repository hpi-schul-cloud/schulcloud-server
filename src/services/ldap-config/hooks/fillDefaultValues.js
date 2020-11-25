const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

/**
 * Sets sensible default values for LDAP configs to be consumed by
 * the ldap-config service. Specifically, attribute mappings for the
 * dn attribute are set to "dn" and provider is set to "general".
 * @param {Object} context Feathers hook context
 * @returns {Object} context if successful
 * @throws {BadRequest} if input format is invalid
 */
module.exports = (context) => {
	const { data } = context;
	if (
		data &&
		data.providerOptions &&
		data.providerOptions.userAttributeNameMapping &&
		(!data.providerOptions.classPathAdditions ||
			data.providerOptions.classPathAdditions === '' ||
			data.providerOptions.classAttributeNameMapping)
	) {
		data.provider = 'general';
		data.providerOptions.userAttributeNameMapping.dn = data.providerOptions.userAttributeNameMapping.dn || 'dn';
		data.providerOptions.classAttributeNameMapping = data.providerOptions.classAttributeNameMapping || {};
		data.providerOptions.classAttributeNameMapping.dn = data.providerOptions.classAttributeNameMapping.dn || 'dn';
		return context;
	}
	throw new BadRequest('Invalid config format');
};
