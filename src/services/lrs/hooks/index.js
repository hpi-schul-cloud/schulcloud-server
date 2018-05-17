const auth = require('feathers-authentication').hooks;

exports.before = {
	all: [auth.authenticate('jwt')],
	find: [],
	get: [],
	create: [context =>{
		let pseudonymService = context.app.service('pseudonym');
		pseudonymService.find({
			query: {
				token: context.data.actorId
			}
		}).then(result => {
			if(result.data.length > 0){
				//TODO: Handle result
				console.log(result);
			}
		});
		return context;
	}],
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
