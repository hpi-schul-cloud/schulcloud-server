const whitelist = {
	'accounts/confirm': {
		methods: {
			post: 201,
		},
	},
	schools: {
		methods: {
			get: 200,
		},
	},
	years: {
		methods: {
			get: 200,
		},
	},
	gradeLevels: {
		methods: {
			get: 200,
		},
	},
	'tools/link': {
		methods: {
			post: 404,
		},
	},
	materials: {
		methods: {
			get: 200,
			post: 400,
			patch: 200,
			delete: 200,
			put: 400,
		},
	},
	'lessons/contents/{type}': {
		methods: {
			get: 200,
		},
	},
	link: {
		methods: {
			get: 500,
		},
	},
	registrationlink: {
		methods: {
			post: 201,
		},
	},
	passwordRecovery: {
		methods: {
			post: 201,
		},
	},
	'passwordRecovery/reset': {
		methods: {
			post: 201,
		},
	},
	'wopi/files/{fileId}/contents': {
		methods: {
			get: 500,
			post: 500,
		},
	},
	'wopi/files/{fileId}': {
		methods: {
			get: 500,
			post: 500,
		},
	},
	'oauth2/baseUrl': {
		methods: {
			get: 200,
		},
	},
	roster: {
		methods: {
			get: 200,
		},
	},
	'roster/users/{user}/metadata': {
		methods: {
			get: 500,
		},
	},
	'roster/users/{user}/groups': {
		methods: {
			get: 500,
		},
	},
	alert: {
		methods: {
			get: 200,
		},
	},
	users: {
		methods: {
			post: 400,
		},
	},
	registrationPins: {
		methods: {
			post: 400,
		},
	},
	registration: {
		methods: {
			post: 400,
		},
	},
	accounts: {
		methods: {
			get: 400,
			post: 400,
		},
	},
	hash: {
		methods: {
			post: 400,
		},
	},
	consents: {
		methods: {
			post: 400,
		},
	},
	consentVersions: {
		methods: {
			get: 200,	// Should remove after the api is changed
		},
	},
	sync: {
		methods: {
			get: 400,
		},
	},
	mails: {
		methods: {
			post: 500,
		},
	},
	consentVersions: {
		methods: {
			get: 200,
		},
	},
};

// TODO remove this
const ignoreList = {
	expertinvitelink: {
		methods: ['post'],
	},
};

module.exports = { whitelist, ignoreList };
