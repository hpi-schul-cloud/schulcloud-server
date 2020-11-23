const express = require('express');

const migrationFactory = require('migrate-mongoose/src/db');
const mongoose = require('mongoose');
const commons = require('@hpi-schul-cloud/commons');

const MigrationModel = migrationFactory(undefined, mongoose.connection);
const { version } = require('../../../package.json');
const { sha, branch, message, stat } = require('../../helper/version');

const { Configuration } = commons;

const router = express.Router();
const startTime = Date.now();
const startedAt = new Date();

router.get('/legacy/v1/version', async (req, res, next) => {
	if (!Configuration.get('FEATURE_SHOW_VERSION_ENABLED')) {
		return res.sendStatus(405);
	}

	const migrations = await MigrationModel.find().lean().exec();

	const { birthtime } = stat;
	return res.json({
		sha,
		version,
		branch,
		message,
		birthtime,
		migrations,
		age: Date.now() - startTime,
		startedAt,
	});
});

module.exports = router;
