const auth = require('feathers-authentication').hooks;
const verbs = require('../verbs.js').verbs;

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

const checkVerb = context => {
	if(context.data.verb){
		context.data.verb = verbs[context.data.verb];
	}
	else{
		context.data.verb = {
			id: context.data.verbId,
			display: context.data.verbDisplayName,
		}
	}
	return context;
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
		verb: context.data.verb,
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
				grouping: {
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
	create: [checkPseudonym, checkVerb, createStatement],
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
