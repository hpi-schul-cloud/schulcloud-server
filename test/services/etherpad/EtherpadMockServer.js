const express = require('express');
const bodyParser = require('body-parser');
const logger = require('../../../src/logger');

// /api/1/
module.exports = function EtherpadMockServer(resolver, url = 'http://localhost:58373', path = '/api') {
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
		getAuthor: `${path}/createAuthorIfNotExistsFor`,
		getGroup: `${path}/createGroupIfNotExistsFor`,
		getPad: `${path}/createGroupPad`,
		getSession: `${path}/createSession`,
		getSessionList: `${path}/listSessionsOfAuthor`,
	};

	app.get('/ping', (req, res) => {
		res.json({
			pong: 'true',
		});
	});

	app.get(uris.getAuthor, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				authorID: '1234',
			},
		}); // all data is fetched constructed from userid in jwt
	});

	app.get(uris.getGroup, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				groupID: '3414',
			},
		});
	});

	app.get(uris.getSessionList, (req, res) => {
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

	app.get(uris.getPad, (req, res) => {
		res.json({
			code: 0,
			message: 'ok',
			data: {
				padID: '5343',
			},
		});
	});

	app.get(uris.getSession, (req, res) => {
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
