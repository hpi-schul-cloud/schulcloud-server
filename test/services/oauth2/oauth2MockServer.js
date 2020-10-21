const express = require('express');
const { promisify } = require('es6-promisify');
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));
const logger = require('../../../src/logger');

module.exports = function oauth2MockServer({ port = null }) {
	const findFreePort = port ? Promise.resolve(port) : freeport();

	return findFreePort.then(
		(freePort) =>
			new Promise((resolve) => {
				const mockOauth = express();
				mockOauth.use(bodyParser.json()); // for parsing application/json
				mockOauth.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
				mockOauth.port = freePort;
				mockOauth.url = `http://localhost:${mockOauth.port}`;
				mockOauth.ltiTool = '';
				mockOauth.post('/clients', (req, res) =>
					res.send({
						client_id: 'unit_test',
					})
				);
				mockOauth.get('/clients', (req, res) => {
					res.send([
						{
							client_id: 'unit_test',
						},
					]);
				});

				mockOauth.delete('/clients/unit_test', (req, res) => {
					res.send({
						client_id: 'unit_test',
					});
				});

				mockOauth.get('/oauth2/auth/requests/login', (req, res) => {
					const loginRequest = {
						challenge: null,
						client: { client_id: 'thethingwearelookingfor' },
					};
					res.send(loginRequest);
				});

				mockOauth.put('/oauth2/auth/requests/login/accept', (req, res) => {
					res.send({
						redirect_to: 'unit_test_2',
					});
				});

				mockOauth.put('/oauth2/auth/requests/login/reject', (req, res) => {
					res.send({
						client_id: null,
					});
				});

				mockOauth.post('/oauth2/introspect', (req, res) => {
					res.send({
						active: false,
					});
				});

				mockOauth.get('/oauth2/auth/sessions/consent', (req, res) => {
					res.send({
						consents: true,
					});
				});

				mockOauth.delete('/oauth2/auth/sessions/consent', (req, res) => {
					res.status(404).send('Was not supposed to succeed');
				});

				mockOauth.listen(mockOauth.port, () => {
					logger.debug('oauth mock is is started! Settings=', mockOauth);
					resolve(mockOauth);
				});
			})
	);
};
