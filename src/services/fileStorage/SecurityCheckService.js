const { FileModel, SecurityCheckStatusTypes } = require('./model');
const { Configuration } = require('@hpi-schul-cloud/commons');
const hooks = require('./hooks/SecurityCheckService.hooks.js');
const logger = require('../../logger');

class SecurityCheckService {
	async update(id, data) {
		if (data.error) {
			logger.error(`Anti-virus service cannot check file with id ${id}. Error message: '${data.error}'`, data);
			return Promise.resolve();
		}
		const status = data.virus_detected === true ? SecurityCheckStatusTypes.BLOCKED : SecurityCheckStatusTypes.VERIFIED;
		await FileModel.updateOne(
			{ 'securityCheck.requestToken': id },
			{
				$set: {
					'securityCheck.requestToken': null,
					'securityCheck.status': status,
					'securityCheck.reason': data.virus_signature || 'Clean',
					'securityCheck.updatedAt': Date.now(),
				},
			}
		).exec();
		return Promise.resolve();
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = {
	service: (app) => {
		const endpoint = '/fileStorage/securityCheck';
		app.use(endpoint, new SecurityCheckService());
		const securityCheckService = app.service(endpoint);
		securityCheckService.hooks(hooks);
	},
};
