const { BadRequest } = require('../../../errors');

const isValidLdapConfigStructure = (config) => {
	return (
		config &&
		config.providerOptions &&
		config.providerOptions.userAttributeNameMapping &&
		// classPathAdditions are optional, but if they exist and are not empty string,
		// classAttributeNameMapping needs to be set
		(!config.providerOptions.classPathAdditions ||
			config.providerOptions.classPathAdditions === '' ||
			config.providerOptions.classAttributeNameMapping)
	);
};

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
	if (isValidLdapConfigStructure(data)) {
		data.provider = 'general';
		data.providerOptions.userAttributeNameMapping.dn = data.providerOptions.userAttributeNameMapping.dn || 'dn';
		data.providerOptions.classAttributeNameMapping = data.providerOptions.classAttributeNameMapping || {};
		data.providerOptions.classAttributeNameMapping.dn = data.providerOptions.classAttributeNameMapping.dn || 'dn';
		return context;
	}
	throw new BadRequest('Invalid config format');
};
