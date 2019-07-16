const getRepoInfo = require('git-repo-info');
const express = require('express');

const router = express.Router();

const fields = ['abbreviatedSha', 'sha', 'branch', 'tag'];

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		res.send(403);
	}
	const info = getRepoInfo();
	const response = {};
	fields.forEach((field) => {
		response[field] = info[field];
	});
	res.send(response);
});

module.exports = router;
