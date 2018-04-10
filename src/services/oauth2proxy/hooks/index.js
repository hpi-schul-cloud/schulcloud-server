exports.before = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: hook => {
		hook.data.idTokenExtra = {
			pseudonym: 'abdcefgh' // TODO: use actual pseudonym
		}
		hook.data.accessTokenExtra = {}
		return hook
	},
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
