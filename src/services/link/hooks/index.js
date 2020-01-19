const hooks = require('feathers-hooks-common');
const { authenticate } = require('@feathersjs/authentication');
const globalHooks = require('../../../hooks');
const logger = require('../../../logger');

const preventDuplicates = async (hook) => {
	const linkData = hook.data;
	// get all links to the same target
	const currentLinks = await hook.app.service('link').find({ query: { target: linkData.target } });

	// check if link to specified target already exists or new link is forced
	if (currentLinks && currentLinks.total > 0 && !linkData.forceNew) {
		// if so, set createdAt date to now so that link expires a month from now
		const id = currentLinks.data[0]._id;
		await hook.app.service('link').patch(id, { createdAt: new Date() }).then((updatedShortlink) => {
			// return the updated link and don't create a new one
			// prevent errors in tests by adding id without underscore
			updatedShortlink.id = updatedShortlink._id;
			hook.result = updatedShortlink;
		}).catch((err) => {
			logger.warning(err);
			return Promise.reject(new Error('Fehler beim Aktualisieren des Kurzlinks.'));
		});
	}
	return hook;
};

exports.before = {
	all: [],
	find: [],
	get: [hooks.disallow('external')], // handled by redirection middleware
	create: [authenticate('jwt'), globalHooks.hasPermission('LINK_CREATE'), preventDuplicates],
	update: [hooks.disallow()],
	patch: [hooks.disallow('external')],
	remove: [globalHooks.ifNotLocal(hooks.disallow())],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};
