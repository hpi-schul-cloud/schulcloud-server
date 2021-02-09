const { disallow } = require('feathers-hooks-common');

exports.before = {
	all: [disallow('external')],
};
