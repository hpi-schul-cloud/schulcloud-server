/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const path = require('path');

const hooks = require('./hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const EduSharingConnectorV6 = require('./services/EduSharingConnectorV6');
const EduSharingConnectorV7 = require('./services/EduSharingConnectorV7');
const MerlinTokenGenerator = require('./services/MerlinTokenGenerator');

class EduSharing {
	constructor() {
		if (Configuration.get('ES_API_V7')) {
			this.connector = EduSharingConnectorV7;
		} else {
			this.connector = EduSharingConnectorV6;
		}
	}

	find(params) {
		return this.connector.FIND(params.query, params.authentication.payload.schoolId);
	}

	get(id, params) {
		return this.connector.GET(id, params.authentication.payload.schoolId);
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

	const edusharing = new EduSharing();
	app.use(eduSharingRoute, edusharing, (req, res) => {
		res.send(res.data);
	});
	const eduSharingService = app.service(eduSharingRoute);
	eduSharingService.hooks(hooks);
};
