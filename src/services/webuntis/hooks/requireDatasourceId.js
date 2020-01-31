const {	BadRequest, NotFound } = require('@feathersjs/errors');

const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const requireDatasourceId = async (context) => {
	const { datasourceId } = (context.params.query || {});
	if (!datasourceId) {
		throw new BadRequest('you have to filter by a datasourceId.');
	}
	const { schoolId: userSchoolId } = await context.app.service('users').get(context.params.account.userId);
	const datasource = await context.app.service('datasources').get(datasourceId)
		.catch((err) => { throw new NotFound('no such datasource', err); });
	if (!equalIds(userSchoolId, datasource.schoolId)) {
		throw new NotFound('no such datasource');
	}

	return Promise.resolve(context);
};

module.exports = requireDatasourceId;
