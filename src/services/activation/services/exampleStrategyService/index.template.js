/* eslint-disable */

// ***************** IMPORTANT *****************
// Please note that if you add a new keyword,
// please create the necessary service from this template
//
//	1.	add new Keyword (../../utils/customStrategyUtils.js)
//	2.	define construction and deconstruction
//		pattern for QuarantinedObject (../../utils/customStrategyUtils.js)
//	3. 	create new service with the name of your
//		new Keyword. There must be at least one
// 		method (update) which takes over the
//		execution of the entry (jobs). You should
//		also create a create method, which can
//		create a new entry.
//	4.	register the route for your new service,
//		it must follow this scheme:
//		/activation/${KEYWORDS.YOUR_NEW_KEYWORD} (../../index.js)
//	5.	please complement the tests
//	6.	done :)
// ***************** IMPORTANT *****************

const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const logger = require('../../../../logger');

const {
	hasPermission,
} = require('../../hooks/utils');

const {
	STATE,
	KEYWORDS: { E_MAIL_ADDRESS }, // <--- set keyword here
	getUser,
	createEntry,
	setEntryState,
	BadRequest,
} = require('../../utils/generalUtils'); // <--- basic building blocks (also include keywords from customStrategyUtils)

/** This service takes care of what should happen when an activation
 * code is redeemed, with the keyword <xyz>. In addition,
 * this service can be used to create an job.
 */
class XYZActivationService {
	/**
	 * create job
	 */
	async create(data, params) {
		if (!data || !data.email || !data.password) throw new BadRequest('Missing information');
		const user = await getUser(this.app, params.account.userId);

		// create new entry
		const entry = await createEntry(this, params.account.userId, E_MAIL_ADDRESS, data.email);

		// send email or do something else here
		// ..................
		return { success: true };
	}

	async update(id, data, params) {
		const { entry, user } = data;

		try {
			await setEntryState(this, entry._id, STATE.PENDING);

			// update something
			// ..................

			// set activation link as consumed
			await setEntryState(this, entry._id, STATE.SUCCESS);
		} catch (error) {
			logger.error(error);
			await setEntryState(this, entry._id, STATE.ERROR);
		}

		// send fyi mail to old email (optional)
		// ..................
	}

	setup(app) {
		this.app = app;
	}
}

const XYZActivationHooks = {
	before: {
		all: [
			authenticate('jwt'),
			hasPermission(['ACCOUNT_EDIT']),
		],
		find: [disallow()],
		get: [disallow()],
		create: [], // <--- set your before hooks for creating a entry (job)
		update: [disallow('external')], // <--- should not be called from outside directly, but over the general service
		patch: [disallow()],
		remove: [disallow()],
	},
};

module.exports = {
	Hooks: XYZActivationHooks,
	Service: XYZActivationService,
};
