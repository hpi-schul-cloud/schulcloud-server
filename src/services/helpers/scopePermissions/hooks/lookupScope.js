const { BadRequest } = require('../../../../errors');
const { resolveScope } = require('./util/resolveScope');

const lookupScope = async (context) => {
	if (context.params === undefined || context.params.route === undefined || context.path === undefined) {
		throw new BadRequest('Missing required params.');
	}
	const { scopeName, scopeId } = resolveScope(context);
	if (scopeName === undefined || scopeId === undefined) {
		throw new BadRequest('Cannot find scope name or scopeId.');
	}
	const service = context.app.service(scopeName);
	if (service === undefined) {
		throw new BadRequest(`Scope '${scopeName}' does not exist.`);
	}
	context.params.scope = await service.get(scopeId);
	return context;
};

module.exports = {
	lookupScope,
};
