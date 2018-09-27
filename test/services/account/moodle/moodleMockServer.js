const express = require('express');
const promisify = require("es6-promisify");
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));	// uses promises with freeport

module.exports = function({
	port=null,
	acceptUsers,
	acceptServices=['moodle_mobile_app'],
	responseToken = '4e897dc3beefe6bc340738fe9e40133b'})
{
	const findFreePort = port ? Promise.resolve(port) : freeport();

	return findFreePort.then((port) => {
		return new Promise((resolve, reject) => {
			const mockMoodle = express();
			mockMoodle.use(bodyParser.json()); // for parsing application/json
			mockMoodle.use(bodyParser.urlencoded({extended: true})); // support encoded bodies
			mockMoodle.responseToken = responseToken;
			mockMoodle.port = port;
			mockMoodle.url = `http://localhost:${port}`;
			mockMoodle.post('/login/token.php', (req, res) => {
				if(!acceptServices.includes(req.body.service)) {
					res.send(`{"error": "Web service ${res.body.service} is not available (it doesn't exist or might be disabled)"}`);
					return;
				}
				if(acceptUsers.find((user) => {
						return user.username == req.body.username
							&& user.password == req.body.password;
					})) {
					res.json({token: responseToken});
				} else {
					res.send(`{"error": "Invalid login, please try again"}`);	// HTTP response code is 200 in any case
				}
			});

			mockMoodle.listen(port, () => {
				resolve(mockMoodle);
			});
		});
	});

};