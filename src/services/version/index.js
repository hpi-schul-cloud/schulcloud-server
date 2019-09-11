const express = require('express');

const { version } = require('../../../package.json');
const {
	sha, branch, message, stat,
} = require('../../helper/version');

const router = express.Router();

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	const { birthtime } = stat;
	return res.json({
		sha, version, branch, message, birthtime,
	});
});

module.exports = router;
