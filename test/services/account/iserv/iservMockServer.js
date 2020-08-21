const express = require('express');
const { promisify } = require('es6-promisify');
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport')); // uses promises with freeport
const config = require('./config');

module.exports = function () {
	const findFreePort = freeport();

	return findFreePort.then(
		(port) =>
			new Promise((resolve) => {
				const mockIServ = express();
				mockIServ.use(bodyParser.json()); // for parsing application/json
				mockIServ.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
				mockIServ.port = port;
				mockIServ.url = `http://localhost:${port}`;
				mockIServ.post('/iserv/oauth/v2/token', (req, res) => {
					if (
						req.body.username === config.testIServUser.username &&
						req.body.password === config.testIServUser.password
					) {
						res.setHeader('Content-Type', 'application/json');
						res.json({ statusCode: '200', accessToken: true });
						return;
					}
					res.setHeader('Content-Type', 'application/json');
					res.status(401).send({ statusCode: '401' });
				});

				mockIServ.listen(port, () => {
					resolve(mockIServ);
				});
			})
	);
};
