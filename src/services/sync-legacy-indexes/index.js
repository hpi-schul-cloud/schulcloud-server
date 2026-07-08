const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const logger = require('../../logger');

const getModels = () => Object.entries(mongoose.models);

class Service {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async create(data, params) {
		if (Configuration.get('ENABLE_SYNC_LEGACY_INDEXES_VIA_FEATHERS_SERVICE')) {
			const models = getModels();
			for (const [modelName, model] of models) {
				logger.alert(`${modelName}.syncIndexes()`);
				try {
					// eslint-disable-next-line no-await-in-loop
					await model.syncIndexes();
				} catch (err) {
					logger.alert(err);
				}
			}
		} else {
			logger.alert(
				'sync-legacy-indexes has been called without enabling ENABLE_SYNC_LEGACY_INDEXES_VIA_FEATHERS_SERVICE'
			);
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function () {
	const app = this;

	app.use('/sync-legacy-indexes', new Service());
};

module.exports.Service = Service;
