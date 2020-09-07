const express = require('express');
const { promisify } = require('es6-promisify');
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));

module.exports = function RocketChatMockServer({ port = null, users = [] }) {
	const findFreePort = port ? Promise.resolve(port) : freeport();

	let idCounter = 0;

	return findFreePort.then(
		(freePort) =>
			new Promise((resolve) => {
				const mockRocketChat = express();
				mockRocketChat.use(bodyParser.json()); // for parsing application/json
				mockRocketChat.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
				mockRocketChat.port = freePort;
				mockRocketChat.url = `http://localhost:${mockRocketChat.port}`;
				mockRocketChat.post('/api/v1/users.create', (req, res) => {
					const newRcUser = {
						email: req.body.email,
						username: req.body.username,
						password: req.body.pass,
						_id: idCounter,
					};
					let validity = 'true';
					users.forEach((user) => {
						if (user.email === newRcUser.email) validity = 'email';
						// if (user.username === newRcUser.username) do something?
					});
					if (validity === 'email') {
						return res.status(403).send({
							error: `${newRcUser.email} is already in use :( [error-field-unavailable]`,
						});
					}

					users.push(newRcUser);
					idCounter += 1;
					return res.send({
						user: {
							_id: newRcUser._id,
							username: newRcUser.username,
						},
					});
				});

				mockRocketChat.post('/api/v1/users.update', (req, res) => {
					const id = req.body.userId;
					users[id].password = req.body.data.password;

					return res.send({ user: users[id] });
				});

				mockRocketChat.get('/api/v1/users.list', (req, res) => {
					if (req.query.query) {
						const substrings = req.query.query.split('"');
						const email = substrings[3];
						const result = [];
						users.forEach((user) => {
							if (user.email === email) result.push(user);
						});
						return res.send({ users: result });
					}
					return res.send({ users });
				});

				mockRocketChat.listen(mockRocketChat.port, () => {
					resolve(mockRocketChat);
				});
			})
	);
};
