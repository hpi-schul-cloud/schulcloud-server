/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const path = require('path');

const hooks = require('./hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const EduSharingConnector = require('./services/EduSharingConnector');
const EduSharingConnectorNew = require('./services/EduSharingConnectorNew');
const MerlinTokenGenerator = require('./services/MerlinTokenGenerator');

class EduSharing {
	find(params) {
		return EduSharingConnector.FIND(params.query, params.authentication.payload.schoolId);
	}

	get(id, params) {
		return EduSharingConnector.GET(id, params.authentication.payload.schoolId);
	}
}

class EduSharingNew {
	find(params) {
		return EduSharingConnectorNew.FIND(params.query, params.authentication.payload.schoolId);
	}

	get(id, params) {
		return EduSharingConnectorNew.GET(id, params.authentication.payload.schoolId);
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

	const edusharing = Configuration.get('ES_USE_OLD_API') ? new EduSharing() : new EduSharingNew();
	app.use(eduSharingRoute, edusharing, (req, res) => {
		res.send(res.data);
	});
	const eduSharingService = app.service(eduSharingRoute);
	eduSharingService.hooks(hooks);
};
