const express = require('express');
const fs = require('fs');
const path = require('path');

const logger = require('../../logger');
const { version } = require('../../../package.json');

const router = express.Router();


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
		if (line) { retValue.push(line); }
	}
	return retValue.join('\n');
};

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	let sha = false;
	let branch = false;
	let message = false;
	try {
		const versionFileLines = fs.readFileSync(path.join(__dirname, '../../../', 'version'), 'utf8').split('\n');
		sha = getLines(versionFileLines, 0);
		branch = getLines(versionFileLines, 1);
		message = getLines(versionFileLines, 2, versionFileLines.length);
	} catch (error) {
		logger.error('version file missing', error);
	}
	return res.json({
		sha, version, branch, message,
	});
});

module.exports = router;
