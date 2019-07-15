const getRepoInfo = require('git-repo-info');
const express = require('express');

const packages = require('../../../package.json');

const router = express.Router();

const fields = [
	'abbreviatedSha',
	'sha',
	'branch',
	'tag',
	'lastTag',
	'committerDate',
	'commitsSinceLastTag',
	'commitMessage',
];

router.get('/version', (req, res, next) => {
	if (!process.env.SHOW_VERSION) {
		res.send(403);
	}
	const info = getRepoInfo();
	const response = { };
	response.version = packages.version;
	fields.forEach((field) => {
		response[field] = info[field];
	});
	res.json(response);
});

module.exports = router;
