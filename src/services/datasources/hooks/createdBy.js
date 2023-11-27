/**
 * adds the createdBy field to the data.
 */
module.exports = (context) => {
	context.data.createdBy = (context.params.account || {}).userId;
	return context;
};
