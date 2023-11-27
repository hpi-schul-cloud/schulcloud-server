const { NotFound, BadRequest } = require('../../../errors');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const requireDatasourceId = async (context) => {
	const { datasourceId } = context.params.query || {};
	if (!datasourceId) {
		throw new BadRequest('you have to filter by a datasourceId.');
	}
	const userPromise = context.app.service('users').get(context.params.account.userId);
	const datasourcePromise = context.app
		.service('datasources')
		.get(datasourceId)
		.catch((err) => {
			throw new NotFound('no such datasource', err);
		});

	const [user, datasource] = await Promise.all([userPromise, datasourcePromise]);
	if (!equalIds(user.schoolId, datasource.schoolId)) {
		throw new NotFound('no such datasource');
	}

	return Promise.resolve(context);
};

module.exports = requireDatasourceId;
