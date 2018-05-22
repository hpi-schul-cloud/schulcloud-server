const auth = require('feathers-authentication').hooks;

const checkPseudonym = context => {
	let pseudonymService = context.app.service('pseudonym');
	return pseudonymService.find({
		query: {
			token: context.data.actorId
		}
	}).then(result => {
		if(result.data.length > 0){
			context.data.actorId = result.data[0].userId;
		}
		return context;
	});
};

const createStatement = context => {
	context.data = {
		actor: {
			account: {
				name: context.data.actorId,
				homePage: "https://bp.schul-cloud.org/"
			},
			objectType: "Agent"
		},
		verb: {
			id: context.data.verbId,
			display: context.data.verbDisplayName,
		},
		object: {
			id: context.data.objectId,
			definition: {
				name: {
					de: context.data.objectName
				},
				description: {
					de: context.data.objectDescription
				}
			},
			objectType: "Activity"
		},
		context: {
			contextActivities: {
				parent: {
					id: context.data.courseId
				}
			}
		}
	};
	return context;
};

exports.before = {
	all: [auth.authenticate('jwt')],
	find: [],
	get: [],
	create: [checkPseudonym, createStatement],
	update: [],
	patch: [],
	remove: []
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
