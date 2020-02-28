const resolveScope = (context) => {
	let scopeName;
	try {
		const arr = context.path.match(/^\/?(\w+)\//);
		if (Array.isArray(arr) && arr.length >= 2) {
			scopeName = arr[1];
		} else {
			scopeName = context.path;
		}
		const scopeId = context.params.route ? context.params.route.scopeId || context.id : context.id;

		return { scopeName, scopeId };
	} catch (e) {
		return {};
	}
};

module.exports = {
	resolveScope,
};
