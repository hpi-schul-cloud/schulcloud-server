/**
 * fetches the datasource from database and adds it to params.
 */
module.exports = async (context) => {
	context.params.datasource = await context.app.service('datasources').get(context.data.datasourceId);
	return context;
};
