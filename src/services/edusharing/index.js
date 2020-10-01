/* eslint-disable max-classes-per-file */
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const hooks = require('./hooks');
const merlinHooks = require('./hooks/merlin.hooks');
const EduSharingConnector = require('./logic/connector');
const MerlinTokenGenerator = require('./logic/MerlinTokenGenerator');

class EduSearch {
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
	const merlinRoute = 'edu-sharing/merlinToken';
	app.use(merlinRoute, new MerlinToken(), (req, res) => {
		res.send(res.data);
	});
	const merlinService = app.service(merlinRoute);
	merlinService.hooks(merlinHooks);

	const eduRoute = '/edu-sharing';
	app.use(eduRoute, new EduSearch(), (req, res) => {
		res.send(res.data);
	});
	const eduService = app.service(eduRoute);
	eduService.hooks(hooks);

	app.use(`${eduRoute}/api`, staticContent(path.join(__dirname, '/docs')));
};
