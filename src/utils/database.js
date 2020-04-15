/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const mongoose = require('mongoose');
const diffHistory = require('mongoose-history-plugin');
const uriFormat = require('mongodb-uri');

const GLOBALS = require('../../config/globals');
const logger = require('../logger');

const configurations = ['test', 'production', 'default', 'migration']; // todo move to config
const env = process.env.NODE_ENV || 'default';

if (!(configurations.includes(env))) {
	throw new Error('if defined, NODE_ENV must be set to test or production');
} else {
	logger.info(`NODE_ENV is set to ${env}`);
}

const config = require(`../../config/${env}.json`);

if (GLOBALS.DATABASE_AUDIT === 'true') {
	logger.info('database audit log enabled');
}

const encodeMongoURI = (urlString) => {
	if (urlString) {
		const parsed = uriFormat.parse(urlString);
		return uriFormat.format(parsed);
	}
	return urlString;
};

function enableAuditLog(schema, options = { modelName: null }) {
	if (GLOBALS.DATABASE_AUDIT === 'true') {
		// Default options
		const defaultOptions = {
			mongoose, // A mongoose instance
			userCollection: 'users', // Colletcion to ref when you pass an user id
			userCollectionIdType: false, // Type for user collection ref id, defaults to ObjectId
			// Collection to ref when you pass an account id or the item has an account property
			accountCollection: 'accounts',
			accountCollectionIdType: false, // Type for account collection ref id, defaults to ObjectId
			userFieldName: 'userId', // Name of the property for the user
			accountFieldName: 'accountId', // Name of the property of the account if any
			timestampFieldName: 'updatedAt', // Name of the property of the timestamp
			methodFieldName: 'method', // Name of the property of the method
			// Cast type for _id (support for other binary types like uuid) defaults to ObjectId
			collectionIdType: false,
			ignore: [], // List of fields to ignore when compare changes
			noDiffSave: false, // If true save event even if there are no changes
			noDiffSaveOnMethods: ['delete'], // If a method is in this list, it saves history even if there is no diff.
			noEventSave: true, // If false save only when __history property is passed
			modelName: '_histories', // Name of the collection for the histories
			embeddedDocument: false, // Is this a sub document
			embeddedModelName: '', // Name of model if used with embedded document

			// If true save only the _id of the populated fields
			// If false save the whole object of the populated fields
			// If false and a populated field property changes it triggers a new history
			// You need to populate the field after a change is made on the
			// original document or it will not catch the differences
			ignorePopulatedFields: true,
		};

		if (!options.modelName) {
			throw new Error('missing modelName in enableAuditLog options');
		}
		options.modelName += defaultOptions.modelName;

		const appliedOptions = { ...defaultOptions, ...options };

		// set database audit
		schema.plugin(diffHistory(appliedOptions));
	}
}

function addAuthenticationToOptions(DB_USERNAME, DB_PASSWORD, options) {
	const auth = {};
	if (DB_USERNAME) {
		auth.user = DB_USERNAME;
	}
	if (DB_PASSWORD) {
		auth.password = DB_PASSWORD;
	}
	if (DB_USERNAME || DB_PASSWORD) {
		options.auth = auth;
	}
}

function getConnectionOptions() {
	// read env params
	const {
		DB_URL = config.mongodb,
		DB_USERNAME,
		DB_PASSWORD,
	} = process.env;

	return {
		url: DB_URL,
		username: DB_USERNAME,
		password: DB_PASSWORD,
	};
}

/**
 * creates the initial connection to a mongodb.
 * see https://mongoosejs.com/docs/connections.html#error-handling for error handling
 *
 * @returns {Promise} rejects on initial errors
 */
function connect() {
	mongoose.Promise = global.Promise;
	const options = getConnectionOptions();

	logger.info('connect to database host',
		options.url,
		options.username ? `with username ${options.username}` : 'without user',
		options.password ? 'and' : 'and without', 'password');

	const mongooseOptions = {
		autoIndex: env !== 'production',
		poolSize: GLOBALS.MONGOOSE_CONNECTION_POOL_SIZE,
		useNewUrlParser: true,
		useFindAndModify: false,
		useCreateIndex: true,
		useUnifiedTopology: true,
	};

	addAuthenticationToOptions(
		options.username,
		options.password,
		mongooseOptions,
	);

	return mongoose.connect(
		encodeMongoURI(options.url),
		mongooseOptions,
	).then((resolved) => {
		// handle errors that appear after connection setup
		mongoose.connection.on('error', (err) => {
			logger.error(err);
		});
		return resolved;
	});
}

function close() {
	return mongoose.connection.close();
}

module.exports = {
	connect,
	close,
	getConnectionOptions,
	enableAuditLog,
};
