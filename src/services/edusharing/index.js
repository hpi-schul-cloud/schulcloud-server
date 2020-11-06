/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const EduSharingConnector = require('./services/EduSharingConnector');
const MerlinTokenGenerator = require('./services/MerlinTokenGenerator');

class EduSharing {
	find(data) {
		return EduSharingConnector.FIND(data);
	}

	get(id, params) {
		return EduSharingConnector.GET(id, params);
	}
}

class MerlinToken {
	find(data) {
		return MerlinTokenGenerator.FIND(data);
	}
}

module.exports = (app) => {
	const eduSharingRoute = '/edu-sharing';
	const merlinRoute = `${eduSharingRoute}/merlinToken`;
	const docRoute = `${eduSharingRoute}/api`;

	app.use(docRoute, staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use(merlinRoute, new MerlinToken(), (req, res) => {
		res.send(res.data);
	});
	const merlinService = app.service(merlinRoute);
	merlinService.hooks(merlinHooks);

	app.use(eduSharingRoute, new EduSharing(), (req, res) => {
		res.send(res.data);
	});
	const eduSharingService = app.service(eduSharingRoute);
	eduSharingService.hooks(hooks);
};
