const express = require('express');
const promisify = require('es6-promisify');
const bodyParser = require('body-parser');
const freeport = promisify(require('freeport'));

module.exports = async function MockServer({ port = null }) {
	const findFreePort = port ? Promise.resolve(port) : freeport();

	const freePort = await findFreePort;

	return new Promise((resolve, reject) => {
		const mockServer = express();
		mockServer.use(bodyParser.json()); // for parsing application/json
		mockServer.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
		mockServer.port = freePort;
		mockServer.url = `http://localhost:${mockServer.port}/`;

		mockServer.post('/projects', (req, res) => {
			res.json({
				id: '3414',
				title: req.body.title || 'Neues Nexboard Projekt',
				description: req.body.description || 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
			});
		});

		mockServer.get('/projects/:id', (req, res) => {
			res.json({
				id: req.params.id,
				title: 'Neues Nexboard Projekt',
				description: 'Hier werden alle Nexboards für diese Lerneinheit gesammelt',
				ownerId: '123',
				boardIds: [],
			});
		});

		mockServer.get('/projects', (req, res) => {
			res.json([3414]);
		});

		mockServer.post('/boards', (req, res) => {
			res.json({
				creationDate: 1555423970889,
				lastModified: 1555423970889,
				vcSessionDate: null,
				id: '14212',
				title: req.body.title || 'Neues Nexboard Board',
				description: req.body.description || 'Ein digitales Whiteboard',
				projectId: req.body.projectId || null,
				isTemplate: false,
				publicLink: 'https://nexboard.nexenio.com/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706',
				preview: 'https://nexboard.nexenio.com/screenshots/14212?date=1555423972&width=300&height=210',
				image: 'https://nexboard.nexenio.com/screenshots/14212?date=1555423972&width=1900&height=1200',
			});
		});

		mockServer.get('/projects/:projectId/boards', (req, res) => {
			if (!req.params.projectId) return res.status(400).send('Could not retrieve projects');

			return res.json([{
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
				publicLink: 'https://nexboard.nexenio.com/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706',
				preview: 'https://nexboard.nexenio.com/screenshots/14212?date=1555424066&width=300&height=210',
				image: 'https://nexboard.nexenio.com/screenshots/14212?date=1555424066&width=1900&height=1200',
			}]);
		});

		mockServer.get('/boards/:id', (req, res) => {
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
				publicLink: 'https://nexboard.nexenio.com/app/client/pub/14212/766u0758-n138-0qx1-m1z3-0711ru670706',
				preview: 'https://nexboard.nexenio.com/screenshots/14212?date=1555424066&width=300&height=210',
				image: 'https://nexboard.nexenio.com/screenshots/14212?date=1555424066&width=1900&height=1200',
			});
		});

		mockServer.server = mockServer.listen(mockServer.port, () => {
			resolve(mockServer);
		});
	});
};
