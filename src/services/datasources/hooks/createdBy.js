module.exports = (context) => {
	context.data.createdBy = (context.params.account || {}).userId;
	return context;
};
