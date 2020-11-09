const service = require('feathers-mongoose');
const { authenticate } = require('@feathersjs/authentication');

const trashbinModel = require('../repo/db/trashbin.schema');

const trashbinModelServiceV2 = service({
	Model: trashbinModel,
	paginate: false,
	lean: true,
});

const trashbinModelServiceV2Hooks = {
	before: {
		all: [
			authenticate('jwt'),
			// check permissions
			// restrict to current school
			// etc
		],
	},
	after: {},
};

module.exports = { trashbinModelServiceV2, trashbinModelServiceV2Hooks };
