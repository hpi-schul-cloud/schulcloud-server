const { disallow } = require('feathers-hooks-common');

const before = {
	all: [disallow('external')],
};
