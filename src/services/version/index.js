const express = require('express');
const fs = require('fs');

const router = express.Router();

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		return res.sendStatus(403);
	}
	try {
		return res.json(
			JSON.parse(
				fs.readFileSync('version.json', 'utf8'),
			),
		);
	} catch (error) {
		return res.send(404, error);
	}
});

module.exports = router;
