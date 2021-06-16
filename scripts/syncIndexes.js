/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const util = require('util');
const appPromise = require('../src/app');

const logger = require('../src/logger');

const getModels = () => Object.entries(mongoose.models);

const extractIndexFromModel = ([modelName, model]) => [modelName, (model.schema || {})._indexes];

const formatToLog = (data) => util.inspect(data, { depth: 5, compact: true, breakLength: 120 });

const syncIndexes = async () => {
	try {
		logger.alert('load app...');
		await appPromise;
		logger.alert('start syncIndexes..');
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

		logger.alert('..syncIndex finished!');

		try {
			const indexes = models.map(extractIndexFromModel);
			logger.alert(formatToLog(indexes));
		} catch (err) {
			logger.alert(err);
		}

		logger.alert('..script finished!');
		process.exit(0);
	} catch (error) {
		logger.error(error);
		process.exit(1);
	}
};

syncIndexes();
