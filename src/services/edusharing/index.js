/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const playerHooks = require('./hooks/player.hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const EduSharingConnector = require('./services/EduSharingConnector');
const MerlinTokenGenerator = require('./services/MerlinTokenGenerator');

class EduSharing {
	find(params) {
		return EduSharingConnector.FIND(params.query, params.authentication.payload.schoolId);
	}

	get(id, params) {
		return EduSharingConnector.GET(id, params.authentication.payload.schoolId);
	}
}

class EduSharingPlayer {
    get(uuid) {
        return EduSharingConnector.getPlayerForNode(uuid);
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

	app.use(eduSharingRoute, new EduSharing(), (req, res) => {
		res.send(res.data);
	});
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
