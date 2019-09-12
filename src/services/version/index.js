const express = require('express');
const fs = require('fs');
const path = require('path');

const mongoose = require('mongoose');

const { Schema } = mongoose;
const logger = require('../../logger');
const { version } = require('../../../package.json');

const router = express.Router();

const migrateSchema = new Schema({
	state: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
		required: true,
	},
	__v: {
		type: Number,
		required: true,
	},
});

const migrationModel = mongoose.model('migrations', migrateSchema);

const getLine = (stringArr, i) => {
	if (stringArr && stringArr.length > i && i >= 0) {
		return stringArr[i].trim();
	}
	return null;
};

const getLines = (stringArr, start, end) => {
	if (!end) {
		// response with single line
		return getLine(stringArr, start);
	}
	// response with multiline
	const retValue = [];
	for (let i = start; i <= end; i += 1) {
		const line = getLine(stringArr, i);
		if (line) {
			retValue.push(line);
		}
	}
	return retValue.join('\n');
};

router.get('/version', async (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	let sha = false;
	let branch = false;
	let message = false;
	let stat = {};
	const migrations = await migrationModel
		.find()
		.lean()
		.exec();

	try {
		const filePath = path.join(__dirname, '../../../', 'version');
		const versionFileLines = fs.readFileSync(filePath, 'utf8').split('\n');
		stat = fs.statSync(filePath);
		sha = getLines(versionFileLines, 0);
		branch = getLines(versionFileLines, 1);
		message = getLines(versionFileLines, 2, versionFileLines.length);
	} catch (error) {
		logger.error('version file missing', error);
	}
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
