const migrationFactory = require('migrate-mongoose/src/db');
const mongoose = require('mongoose');

const MigrationModel = migrationFactory(undefined, mongoose.connection);
const { version } = require('../../../../package.json');
const { sha, branch, message, stat } = require('../../../helper/version');

const startTime = Date.now();
const startedAt = new Date();

class Version {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find() {
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
