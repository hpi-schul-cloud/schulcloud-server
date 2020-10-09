const reqlib = require('app-root-path').require;

const { Forbidden } = reqlib('src/errors');

module.exports = async (context) => {
	if (context.data && context.data.ldapConfig && context.data.ldapConfig.provider) {
		const currentSystem = await context.app.service('systems').get(context.id);
		if (currentSystem.ldapConfig.provider !== context.data.ldapConfig.provider) {
			throw new Forbidden('Cannot change providers.');
		}
		if (currentSystem.ldapConfig.provider === 'iserv-idm') {
			throw new Forbidden('Not allowed to change this system');
		}
	}
	return context;
};
