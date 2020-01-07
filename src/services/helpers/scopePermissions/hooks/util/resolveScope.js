const resolveScope = (context) => {
	try {
		const scopeName = context.path.match(/^\/?(\w+)\//)[1];
		const { scopeId } = context.params.route;

		return { scopeName, scopeId };
	} catch (e) {
		return {};
	}
};

module.exports = {
	resolveScope,
};
