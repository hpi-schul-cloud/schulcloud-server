/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const util = require('util');
const appPromise = require('../src/app');
const logger = require('../src/logger');

const getModels = () => Object.entries(mongoose.models);

const syncIndex = ([_modelName, model]) => model.syncIndexes();
const extractIndexFromModel = ([modelName, model]) => [modelName, model.schema._indexes];

const formatToLog = (data) => util.inspect(data, { depth: 5, compact: true, breakLength: 120 });

const syncIndexes = async () => {
	try {
		logger.alert('load app...');
		await appPromise;
		logger.alert('start syncIndexes..');
		const models = getModels();
		await Promise.all(models.map((m) => syncIndex(m)));
		const indexes = models.map(extractIndexFromModel);
		logger.alert('list all indexes \n', formatToLog(indexes));
		logger.alert('..finished!');
		process.exit(0);
	} catch (error) {
		logger.error(error);
		process.exit(1);
	}
};

syncIndexes();
