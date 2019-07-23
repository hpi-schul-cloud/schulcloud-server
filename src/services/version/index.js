const express = require('express');
const fs = require('fs');
const path = require('path');

const logger = require('../../logger');
const { version } = require('../../../package.json');

const router = express.Router();

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	let sha = false;
	try {
		sha = fs.readFileSync(path.join(__dirname, '../../../', 'version'), 'utf8').trim();
	} catch (error) {
		logger.error(error);
	}
	return res.json({ sha, version });
});

module.exports = router;
