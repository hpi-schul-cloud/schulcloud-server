/* eslint-disable max-classes-per-file */
const { MethodNotAllowed } = require('@feathersjs/errors');
const { static: staticContent } = require('@feathersjs/express');
const { Configuration } = require('@hpi-schul-cloud/commons/lib');
const path = require('path');

const hooks = require('./hooks');
const playerHooks = require('./hooks/player.hooks');
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

class EduSharingPlayer {
	get(uuid) {
		if (!Configuration.get('ES_API_V7')) {
			throw new MethodNotAllowed('This feature is disabled on this instance');
		}
		const esPlayer = EduSharingConnectorV7.getPlayerForNode(uuid);
		
		return esPlayer;
	}
}

class MerlinToken {
	find(data) {
		return MerlinTokenGenerator.FIND(data);
	}
}

module.exports = (app) => {
	const eduSharingRoute = '/edu-sharing';
	const eduSharingPlayerRoute = '/edu-sharing/player';
	const merlinRoute = '/edu-sharing/merlinToken';
	const docRoute = '/edu-sharing/api';

	app.use(eduSharingRoute, new EduSharing());
	const eduSharingService = app.service(eduSharingRoute);
	eduSharingService.hooks(hooks);

	app.use(eduSharingPlayerRoute, new EduSharingPlayer(), (req, res) => {
		res.send(res.data);
	});
	const eduSharingPlayerService = app.service(eduSharingPlayerRoute);
	eduSharingPlayerService.hooks(playerHooks);

	app.use(merlinRoute, new MerlinToken(), (req, res) => {
		res.send(res.data);
	});
	const merlinService = app.service(merlinRoute);
	merlinService.hooks(merlinHooks);

	app.use(docRoute, staticContent(path.join(__dirname, '/docs/openapi.yaml')));
};
