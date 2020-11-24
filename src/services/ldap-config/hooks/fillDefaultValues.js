const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

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
