const { iff, isProvider } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');

module.exports = {
	before: {
		all: [iff(isProvider('external'), [
			authenticate('api-key'),
		])],
	},
}