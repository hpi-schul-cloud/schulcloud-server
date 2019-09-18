module.exports = (context) => {
	context.data.updatedBy = (context.params.account || {}).userId;
	return context;
};
