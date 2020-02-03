const replaceFields = (datasource) => {
	const protectedFields = datasource.protected || [];
	if (!protectedFields.includes('password')) protectedFields.push('password');
	protectedFields.forEach((key) => {
		if (key !== 'target' && datasource.config[key]) {
			datasource.config[key] = '<secret>';
		}
	});
	return datasource;
};

/**
 * replaces the values of protected fields with '<secret>'
 */
module.exports = async (context) => {
	if (context.method === 'find' && ((context.result || {}).data || []).length > 0) {
		context.result.data = context.result.data.map((ds) => replaceFields(ds));
	} else {
		context.result = replaceFields(context.result);
	}
	return Promise.resolve(context);
};
