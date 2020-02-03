/**
 * replaces the values of protected fields with 'secret'
 */
module.exports = async (context) => {
	if (!context || !context.result || !Array.isArray(context.result.protected)) {
		return context;
	}
	context.result.protected.forEach((key) => {
		if (key !== 'target' && context.result.config[key]) {
			context.result.config[key] = 'secret';
		}
	});
	return context;
};
