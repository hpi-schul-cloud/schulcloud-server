const { authenticate } = require('@feathersjs/authentication').hooks;
const { disallow } = require('feathers-hooks-common');
const logger = require('../../../logger');

const {
	getEntriesByUserId,
	deleteEntry,
	validEntry,
	getUser,
	getEntryByActivationCode,
	NotFound,
	customErrorMessages,
} = require('../utils');

const { filterEntryParamNames } = require('../hooks/utils');

/** This service does all general things like finding open jobs,
 * redeeming activation codes, deleting jobs. But this service
 * does not deal with what should happen when the activation
 * code is redeemed, e.g. changing the email/user name.
 */
class ActivationService {
	/**
	 * find open jobs
	 * will return filterd array of open jobs
	 */
	async find(params) {
		const { userId } = params.account;
		const entry = await getEntriesByUserId(this, userId);
		return { success: true, entry };
	}

	/**
	 *  redeem activationCode
	 */
	async update(id, data, params) {
		// valid entry and valid activtionCode
		if (!id) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		const user = await getUser(this, params.account.userId);
		const entry = await getEntryByActivationCode(this, user._id, id);

		if (!user) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		if (!entry) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		validEntry(entry);

		try {
			// custom job part here (done by specific service)
			await this.app.service(`/activation/${entry.keyword}`).update(id, { user, entry });

			// delete entry
			await deleteEntry(this, entry._id);
			return { success: true, keyword: entry.keyword };
		} catch (error) {
			logger.error(error);
			return { success: false, keyword: entry.keyword, error: error.message };
		}
	}

	/**
	 * remove open job
	 */
	async remove(keyword, params) {
		let removed = 0;
		const { userId } = params.account;
		const entry = await getEntriesByUserId(this, userId, keyword);
		if (entry) {
			await deleteEntry(this, entry._id);
			removed += 1;
			return { success: true, removed };
		}
		return { success: false, removed };
	}

	setup(app) {
		this.app = app;
	}
}

const activationHooks = {
	before: {
		all: [
			authenticate('jwt'),
		],
		find: [],
		get: [disallow()],
		create: [disallow()],
		update: [],
		patch: [disallow()],
		remove: [],
	},
	after: {
		find: [filterEntryParamNames],
		get: [],
		create: [],
		update: [],
		patch: [],
		remove: [],
	},
};

module.exports = {
	Hooks: activationHooks,
	Service: ActivationService,
};
