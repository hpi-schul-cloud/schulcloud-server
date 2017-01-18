const express = require('express');
const promisify = require("es6-promisify");
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));	// uses promises with freeport
const config = require('./config');

module.exports = function()
{
	const findFreePort = freeport();

	return findFreePort.then((port) => {
		return new Promise((resolve, reject) => {
			const mockLernsax = express();
			mockLernsax.use(bodyParser.json()); // for parsing application/json
			mockLernsax.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
			mockLernsax.port = port;
			mockLernsax.url = `http://localhost:${port}`;
			mockLernsax.get('/webdav.php', (req, res) => {
        if(req.query.username === config.testLernSaxUser.username && req.query.password === config.testLernSaxUser.password) {
          res.setHeader('Content-Type', 'application/json');
          res.json({statusCode: "200"});
          return;
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(401).send({statusCode: "401"});
        return;
			});

			mockLernsax.listen(port, () => {
				resolve(mockLernsax);
			});
		});
	});

};
