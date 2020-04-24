const { iff, isProvider } = require('feathers-hooks-common');
const { Configuration } = require('@schul-cloud/commons');
const { NotAuthenticated } = require('@feathersjs/errors');

const checkForKey = (context) => {
	const key = context.params.headers['x-api-key'];
	if (!key === Configuration.get('CLIENT_API_KEY')) throw new NotAuthenticated('no permission');
	return context;
};

module.exports = {
	before: {
		all: [iff(isProvider('external'), [
			checkForKey,
		])],
	},
};
