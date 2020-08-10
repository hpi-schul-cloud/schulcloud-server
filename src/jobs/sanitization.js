const mongoose = require('mongoose');
const _ = require('lodash');
const database = require('../utils/database');
const logger = require('../logger');
const { sanitizeHtml: { sanitizeDeep } } = require('../utils');

const collectionNames2Paths = new Map([
	['lessons', 'lessons'], ['news', 'news'], ['homeworks', 'homework'], ['submissions', 'submissions']]);
const getPath = (collectionName) => collectionNames2Paths.get(collectionName);


const collectionName2SafeAttributes = new Map([
	['helpdocument', ['title', 'content']], ['helpdocuments', ['title', 'content']]]);
const getSafeAttributes = (collectionName) => collectionName2SafeAttributes.get(collectionName);

const getDiffProps = (a, b) => _.reduce(a, (result, value, key) => (_.isEqual(value, b[key]) ?
	result : result.concat(key)), []);

/**
 * NOTE: this is the first job script. To run it, simply execute 'node src/jobs/sanitization.js'.
 * It is expected to pass MongoDB parameters as process environment variables.
 * Please see src/utils/database.js for more.
*/
async function run() {
	logger.info('will collect list all affected db documents...');
	await database.connect();

	let globalResultCount = 0;
	const collections = await mongoose.connection.db.collections();
	for (const collection of collections) {
		let resultCount = 0;
		logger.info(`processing: ${collection.collectionName}`);
		try {
			const cursor = collection.find({});

			let doc = await cursor.next();
			while (doc) {
				const data = sanitizeDeep({ ...doc }, getPath(collection.collectionName), 0,
					getSafeAttributes(collection.collectionName));
				if (!_.isEqual(data, doc)) {
					const result = { collection: collection.collectionName, db: doc, sanitized: data };
					logger.debug(result);
					logger.info({ id: doc._id, diffProps: getDiffProps(doc, data) });
					resultCount += 1;
				}
				doc = await cursor.next();
			}
			logger.info(`${collection.collectionName} doc with diffs result count: ${resultCount}`);
			globalResultCount += resultCount;
		} catch (error) {
			logger.error(`Error while processing: ${collection.collectionName}`, error);
		}
	}

	logger.info(`Total number of docs affected: ${globalResultCount}`);
	// exit-code > 0 means # of errors
	process.exit(globalResultCount);
}

run();
