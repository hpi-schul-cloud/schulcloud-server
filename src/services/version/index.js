const express = require('express');

const migrationFactory = require('migrate-mongoose/src/db');
const mongoose = require('mongoose');
const MigrationModel = migrationFactory(undefined, mongoose.connection);
const { version } = require('../../../package.json');
const {
	sha, branch, message, stat,
} = require('../../helper/version');

const router = express.Router();

router.get('/version', async (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}

	const migrations = await MigrationModel
		.find()
		.lean()
		.exec();

	const { birthtime } = stat;
	return res.json({
		sha,
		version,
		branch,
		message,
		birthtime,
		migrations,
	});
});

module.exports = router;
