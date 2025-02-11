/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const playerHooks = require('./hooks/player.hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const eduSharingConnectorV7 = require('./services/EduSharingConnectorV7');
const MerlinTokenGenerator = require('./services/MerlinTokenGenerator');

class EduSharing {
	find(params) {
		return eduSharingConnectorV7.FIND(params.query, params.authentication.payload.schoolId);
	}

	get(id, params) {
		return eduSharingConnectorV7.GET(id, params.authentication.payload.schoolId);
	}
}

class EduSharingPlayer {
	get(uuid) {
		const esPlayer = eduSharingConnectorV7.getPlayerForNode(uuid);

		return esPlayer;
	}
}

class MerlinTokenService {
	find(data) {
		return MerlinTokenGenerator.FIND(data);
	}
}

module.exports = (app) => {
	const eduSharingRoute = '/edu-sharing';
	app.use(eduSharingRoute, new EduSharing());
	const eduSharingService = app.service(eduSharingRoute);
	eduSharingService.hooks(hooks);

	const eduSharingPlayerRoute = '/edu-sharing/player';
	app.use(eduSharingPlayerRoute, new EduSharingPlayer(), (req, res) => {
		res.send(res.data);
	});
	const eduSharingPlayerService = app.service(eduSharingPlayerRoute);
	eduSharingPlayerService.hooks(playerHooks);

	const merlinRoute = '/edu-sharing-merlinToken';
	app.use(merlinRoute, new MerlinTokenService(), (req, res) => {
		res.send(res.data);
	});
	const merlinService = app.service(merlinRoute);
	merlinService.hooks(merlinHooks);

	app.use('/edu-sharing/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
};
