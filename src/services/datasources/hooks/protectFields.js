/**
 * replaces the values of protected fields with '<secret>'
 */
module.exports = async (context) => {
	const protectedFields = context.result.protected || [];
	if (!protectedFields.includes('password')) protectedFields.push('password');
	protectedFields.forEach((key) => {
		if (key !== 'target' && context.result.config[key]) {
			context.result.config[key] = '<secret>';
		}
	});
	return context;
};
