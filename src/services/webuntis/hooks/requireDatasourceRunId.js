const {	BadRequest, NotFound } = require('@feathersjs/errors');

const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const requireDatasourceRunId = async (context) => {
	const { datasourceRunId } = (context.params.query || {});
	if (!datasourceRunId) {
		throw new BadRequest('you have to filter by a datasourceRunId.');
	}
	const { schoolId: userSchoolId } = await context.app.service('users').get(context.params.account.userId);
	const datasourceRun = await context.app.service('datasourceRuns').get(datasourceRunId);
	if (!datasourceRun || !equalIds(userSchoolId, datasourceRun.schoolId)) {
		throw new NotFound('no such datasourceRun');
	}

	return Promise.resolve(context);
};

module.exports = requireDatasourceRunId;
