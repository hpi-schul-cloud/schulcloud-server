const express = require('express');

const migrationFactory = require('migrate-mongoose/src/db');
const mongoose = require('mongoose');

const MigrationModel = migrationFactory(undefined, mongoose.connection);
const { version } = require('../../../package.json');
const { sha, branch, message, stat } = require('../../helper/version');
const { SHOW_VERSION } = require('../../../config/globals');

const router = express.Router();
const startTime = Date.now();
const startedAt = new Date();

router.get('/version', async (req, res, next) => {
	if (!SHOW_VERSION) {
		return res.sendStatus(403);
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
