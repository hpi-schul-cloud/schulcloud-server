/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const util = require('util');
const appPromise = require('../src/app');

const getModels = () => Object.entries(mongoose.models);

const syncIndex = ([modelName, model]) => model.syncIndexes();
const extractIndexFromModel = ([modelName, model]) => [modelName, model.schema._indexes];

const formatToLog = (data) => util.inspect(data, { depth: 5, compact: true, breakLength: 120 });

appPromise
	.then(async (app) => {
		console.log('start syncIndexes..');
		const models = getModels();
		await Promise.all(models.map(m => syncIndex(m)))
		const indexes = models.map(extractIndexFromModel);
		console.log('list all indexes \n', formatToLog(indexes));
		console.log('..finished!');
		return process.exit(0);
	})
	.catch((error) => {
		console.error(error);
		return process.exit(1);
	});
