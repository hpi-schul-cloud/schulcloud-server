const { Forbidden } = require('../../../errors');

module.exports = async (context) => {
	const currentSystem = await context.app.service('systems').get(context.id);
	if (currentSystem.ldapConfig.provider === 'iserv-idm') {
		throw new Forbidden('Not allowed to change this system');
	}

	if (context.data && context.data.ldapConfig && context.data.ldapConfig.provider) {
		if (currentSystem.ldapConfig.provider !== context.data.ldapConfig.provider) {
			throw new Forbidden('Cannot change providers.');
		}
	}
	return context;
};
