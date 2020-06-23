const { authenticate } = require('@feathersjs/authentication').hooks;
const logger = require('../../../logger');

const {
	lookupByUserId,
	deleteEntry,
	filterEntryParamNames,
	validEntry,
	getUser,
	lookupByActivationCode,
	NotFound,
	customErrorMessages,
} = require('../utils');


class ActivationService {
	async find(params) {
		const { userId } = params.authentication.payload;
		const entry = await lookupByUserId(this, userId);
		filterEntryParamNames(entry, ['keyword', 'quarantinedObject']);
		return { success: true, entry };
	}

	async update(id, data, params) {
		// valid entry and valid activtionCode
		if (!id) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		const user = await getUser(this, params.account.userId);
		const entries = await lookupByActivationCode(this, user._id, id);

		if (!user) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		if ((entries || []).length !== 1) throw new NotFound(customErrorMessages.ACTIVATION_LINK_INVALID);
		const entry = entries[0];
		validEntry(entry);

		try {
			// custom job part
			await this.app.service(`/activation/${entry.keyword}`).update(id, { user, entry }, params);

			// delete entry
			await deleteEntry(this, entry._id);
			return { success: true, keyword: entry.keyword };
		} catch (error) {
			logger.error(error);
			return { success: false, keyword: entry.keyword };
		}
	}

	async remove(keyword, params) {
		let removed = 0;
		const { userId } = params.authentication.payload;
		const entry = await lookupByUserId(this, userId, keyword);
		if (entry) {
			deleteEntry(this, entry._id);
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
