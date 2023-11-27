const express = require('express');
const bodyParser = require('body-parser');

const logger = require('../../../src/logger');

module.exports = function MockServer(url = 'http://localhost:58372', uri = '/', resolver) {
	const app = express();
	app.use(bodyParser.json()); // for parsing application/json
	app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

	let port;
	try {
		port = Number(url.split('http://localhost:')[1]);
	} catch (err) {
		logger.warning('Can not set port.', err);
		port = 58372;
	}

	const uris = {
		postProject: `${uri}projects`,
		getProject: `${uri}projects/:id`,
		findProject: `${uri}projects`,
		postBoards: `${uri}boards`,
		getProjectBoards: `${uri}projects/:projectId/boards`,
		getBoard: `${uri}boards/:id`,
	};

	app.get('/ping', (req, res) => {
		res.json({
			pong: 'true',
		});
	});

	app.post(uris.postProject, (req, res) => {
		res.json({
			id: '3414',
			title: req.body.title || 'Neues Nexboard Projekt',
			description: req.body.description || 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
		});
	});

	app.get(uris.getProject, (req, res) => {
		res.json({
			id: req.params.id,
			title: 'Neues Nexboard Projekt',
			description: 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
			ownerId: '123',
			boardIds: [],
		});
	});

	app.get(uris.findProject, (req, res) => {
		res.json([3414]);
	});

	app.post(uris.postBoards, (req, res) => {
		res.json({
			creationDate: 1555423970889,
			lastModified: 1555423970889,
			vcSessionDate: null,
			id: '14212',
			title: req.body.title || 'Neues Nexboard Board',
			description: req.body.description || 'Ein digitales Whiteboard',
			projectId: req.body.projectId || null,
			isTemplate: false,
			publicLink: `${url}/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706`,
			preview: `${url}/screenshots/14212?date=1555423972&width=300&height=210`,
			image: `${url}/screenshots/14212?date=1555423972&width=1900&height=1200`,
		});
	});

	app.get(uris.getProjectBoards, (req, res) => {
		if (!req.params.projectId) return res.status(400).send('Could not retrieve projects');

		return res.json([
			{
				id: '14212',
				key: 'S56abfefa',
				title: 'Neues Nexboard Board',
				projectId: req.params.projectId || 3414,
				description: 'Ein digitales Whiteboard',
				creationDate: 1555423970889,
				lastModified: 1555423970889,
				isTemplate: false,
				meta: null,
				isPublic: false,
				publicLink: `${url}/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706`,
				preview: `${url}/screenshots/14212?date=1555424066&width=300&height=210`,
				image: `${url}/screenshots/14212?date=1555424066&width=1900&height=1200`,
			},
		]);
	});

	app.get(uris.getBoard, (req, res) => {
		res.json({
			id: req.params.id,
			key: 'S56abfefa',
			title: 'Neues Nexboard Board',
			projectId: req.query.projectId || 3414,
			description: 'Ein digitales Whiteboard',
			creationDate: 1555423970889,
			lastModified: 1555423970889,
			isTemplate: false,
			meta: null,
			isPublic: false,
			publicLink: `${url}/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706`,
			preview: `${url}/screenshots/14212?date=1555424066&width=300&height=210`,
			image: `${url}/screenshots/14212?date=1555424066&width=1900&height=1200`,
		});
	});

	const server = app.listen(port);
	server.on('listening', () => {
		logger.info(`Nexboard mock application started on ${url}`, uris);
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
