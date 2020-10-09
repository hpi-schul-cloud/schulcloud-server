const { disallow } = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider } = require('feathers-hooks-common');
const { isSuperHero } = require('../../../hooks');

/**
 * checks if the user has valid permissions to skip registration of the target user.
 * @param {context} hook hook context.
 * @throws {Forbidden} if user does not have correct permissions.
 */

const MarkUserAsDeleted = {
	before: {
		all: [authenticate('jwt')],
		find: [disallow()],
		get: [disallow()],
		create: [disallow()],
		update: [authenticate('jwt'), iff(isProvider('external'), isSuperHero())],
		patch: [disallow()],
		remove: [disallow()],
	},
};

module.exports = { MarkUserAsDeleted };
