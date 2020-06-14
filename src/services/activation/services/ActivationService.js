const { authenticate } = require('@feathersjs/authentication').hooks;
const { NotFound } = require('@feathersjs/errors');

const {
	hasPermission,
} = require('../hooks/utils');

const {
	lookupByUserId,
	deleteEntry,
	sanitizeEntries,
	validEntry,
	getUser,
	lookupByActivationCode,
} = require('../utils');


class activationService {
	async find(params) {
		const { userId } = params.authentication.payload;
		const entry = await lookupByUserId(this, userId);
		sanitizeEntries(entry, ['keyword', 'quarantinedObject']);
		return { success: true, entry };
	}

	async update(id, data, params) {
		if (!id) throw new NotFound('activation link invalid');
		const user = await getUser(this, params.account.userId);
		const entries = await lookupByActivationCode(this, user._id, id);

		if (!user) throw new NotFound('activation link invalid');
		if ((entries || []).length !== 1) throw new NotFound('activation link invalid');
		const entry = entries[0];
		validEntry(entry);
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
			hasPermission(['ACCOUNT_EDIT']),
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
	Service: activationService,
};
