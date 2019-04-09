const express = require('express');
const promisify = require('es6-promisify');
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));

module.exports = function RocketChatMockServer({
	port = null,
	users = [],
}) {
	const findFreePort = port ? Promise.resolve(port) : freeport();

	let idCounter = 1;

	return findFreePort.then(freePort => new Promise((resolve) => {
		const mockRocketChat = express();
		mockRocketChat.use(bodyParser.json()); // for parsing application/json
		mockRocketChat.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
		mockRocketChat.port = freePort;
		mockRocketChat.url = `http://localhost:${mockRocketChat.port}`;
		mockRocketChat.post('/api/v1/users.register', (req, res) => {
			const newRcUser = {
				email: req.body.email,
				username: req.body.username,
				password: req.body.password,
				_id: idCounter,
			};
			users.forEach((user) => {
				if (user.email === newRcUser.email) res.status(403).send('Email already exists. [403]');
				// if (user.username === newRcUser.email) do something?
			});
			idCounter += 1;
			res.send(
				{
					user: {
						_id: newRcUser._id,
						username: newRcUser.username,
					},
				},
			);
		});

		mockRocketChat.listen(mockRocketChat.port, () => {
			resolve(mockRocketChat);
		});
	}));
};
