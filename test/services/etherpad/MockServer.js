const express = require('express');
const bodyParser = require('body-parser');
const { Configuration } = require('@hpi-schul-cloud/commons');

const logger = require('../../../src/logger');

// /api/1/
module.exports = function MockServer(
	url = 'http://localhost:58373',
	path = Configuration.get('ETHERPAD_API_PATH'),
	resolver
) {
	const app = express();
	app.use(bodyParser.json()); // for parsing application/json
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

	let port;
	try {
		port = Number(url.split('http://localhost:')[1].split('/')[0]);
	} catch (err) {
		logger.warning('Can not set port.', err);
		port = 58373;
	}

	const uris = {
		postAuthor: `${path}/createAuthorIfNotExistsFor`,
		postGroup: `${path}/createGroupIfNotExistsFor`,
		postPad: `${path}/createGroupPad`,
		postSession: `${path}/createSession`,
		postSessionList: `${path}/listSessionsOfAuthor`,
	};

	app.get('/ping', (req, res) => {
		res.json({
			pong: 'true',
		});
	});

	app.post(uris.postAuthor, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				authorID: '1234',
			},
		}); // all data is fetched constructed from userid in jwt
	});

	app.post(uris.postGroup, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				groupID: '3414',
			},
		});
	});

	app.post(uris.postSessionList, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				's.2d470b52539b77200c87e68590fec220': {
					groupID: '3414',
					authorID: '1234',
					validUntil: parseInt(new Date(Date.now()).getTime() / 1000, 10) + 10000,
				},
			},
		});
	});

	app.post(uris.postPad, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				padID: '5343',
			},
		});
	});

	app.post(uris.postSession, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				sessionID: 's.6c18f67f92f78efdd88cd34a3d5538fd',
			},
		});
	});

	const server = app.listen(port);
	server.on('listening', () => {
		logger.info(`Etherpad mock application started on ${url}`, uris);
		if (resolver) {
			resolver();
		}
	});
	return {
		server,
		app,
		port,
		uris,
	};
};
