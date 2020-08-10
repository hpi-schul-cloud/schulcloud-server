const service = require('feathers-mongoose');
const problemModel = require('./model');
const hooks = require('./hooks');
const logger = require('../../logger');
const {} = require('../../../config/globals');
const { Configuration } = require('@schul-cloud/commons');

if (!Configuration.has('BODYPARSER_JSON_LIMIT')) {
	/* eslint-disable-next-line  */
	logger.warning(
		`please set the environment variable BODYPARSER_JSON_LIMIT to min. '${Math.ceil(
			1.36 *
				(Configuration.get(
					'MAXIMUM_ALLOWABLE_TOTAL_ATTACHMENTS_SIZE_BYTE',
				) /
					1024 /
					1024),
		)}mb' for helpdesk to work correctly! (Currently: ${Configuration.get(
			'BODYPARSER_JSON_LIMIT',
		)})`,
	);
}

module.exports = function () {
	const app = this;

	const options = {
		Model: problemModel,
		paginate: {
			default: 25,
			max: 1000,
		},
		lean: true,
	};

	app.use('/helpdesk', service(options));
	const helpdeskService = app.service('/helpdesk');
	helpdeskService.hooks(hooks);
};
