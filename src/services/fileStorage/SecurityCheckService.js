const { FileModel, SecurityCheckStatusTypes } = require('./model');
const hooks = require('./hooks/SecurityCheckService.hooks.js');
const logger = require('../../logger');

class SecurityCheckService {
	async update(id, data) {
		if (data.error) {
			logger.error(`Anti-virus service cannot check file with id ${id}. Error message: '${data.error}'`, data);
			return Promise.resolve();
		}
		const status = data.virus_detected === true
			? SecurityCheckStatusTypes.BLOCKED
			: SecurityCheckStatusTypes.VERIFIED;
		await FileModel.updateOne(
			{ 'securityCheck.requestToken': id },
			{
				$set: {
					'securityCheck.requestToken': null,
					'securityCheck.status':	status,
					'securityCheck.updatedAt': Date.now(),
				},
			},
		).exec();
		return Promise.resolve();
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = (app) => {
	app.use('/fileStorage/securityCheck', new SecurityCheckService());
	const securityCheckService = app.service('/fileStorage/securityCheck');
	securityCheckService.hooks(hooks);
};
