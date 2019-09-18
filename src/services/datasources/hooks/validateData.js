const { BadRequest } = require('@feathersjs/errors');

module.exports = (context) => {
	if (!((context.data || {}).config || {}).type) {
		throw new BadRequest('config should contain a type');
	}
	context.data = {
		name: context.data.name,
		config: context.data.config,
		schoolId: context.data.schoolId,
		createdBy: context.params.account.userId,
	};
	return context;
};
