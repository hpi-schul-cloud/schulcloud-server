const migrationFactory = require('migrate-mongoose/src/db');
const mongoose = require('mongoose');
const commons = require('@hpi-schul-cloud/commons');

const { MethodNotAllowed } = require('../../../errors');

const MigrationModel = migrationFactory(undefined, mongoose.connection);
const { version } = require('../../../../package.json');
const { sha, branch, message, stat } = require('../../../helper/version');

const { Configuration } = commons;

const startTime = Date.now();
const startedAt = new Date();

class Version {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find(params) {
		if (!Configuration.get('FEATURE_SHOW_VERSION_ENABLED')) {
			throw new MethodNotAllowed();
		}

		const migrations = await MigrationModel.find().lean().exec();

		const { birthtime } = stat;
		return {
			sha,
			version,
			branch,
			message,
			birthtime,
			migrations,
			age: Date.now() - startTime,
			startedAt,
		};
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Version;
