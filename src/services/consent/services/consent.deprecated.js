const { authenticate } = require('@feathersjs/authentication');
const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { BadRequest } = require('../../../errors');
const { userToConsent, modifyDataForUserSchema } = require('../utils/consent');
const { restrictToCurrentUser } = require('../hooks/consents');

const consentHooks = {
	before: {
		all: [authenticate('jwt')],
		get: [iff(isProvider('external'), restrictToCurrentUser)],
		find: [iff(isProvider('external'), restrictToCurrentUser)],
		create: [disallow('external')],
		update: [iff(isProvider('external'), restrictToCurrentUser)],
		patch: [iff(isProvider('external'), restrictToCurrentUser)],
		remove: [iff(isProvider('external'), restrictToCurrentUser)],
	},
};

class ConsentService {
	async find(params) {
		const {
			query: { userId, $limit, $skip, ...oldQuery },
		} = params;

		const query = {
			$limit,
			$skip,
		};

		if (userId !== undefined) {
			// check for _basonType is need for internal request
			// and because of id could also include an $in or simular
			// eslint-disable-next-line no-underscore-dangle
			if (typeof userId === 'string' || userId._bsontype === 'ObjectID') {
				const user = await this.modelService.get(userId);
				return {
					total: 1,
					limit: $limit || 25,
					skip: 0,
					data: [userToConsent(user)],
				};
			}

			if ({}.hasOwnProperty.call(userId, '$in') && Array.isArray(userId.$in)) {
				query._id = {
					$in: userId.$in,
				};
			}
		}

		if (Object.keys(oldQuery).length !== 0) {
			query.consent = {
				...oldQuery, // TODO: check if necassery or cleanup client
			};
		} else {
			query.consent = {
				$exists: true,
			};
		}

		const users = await this.modelService.find({ query });
		return {
			...users,
			data: users.data.map(userToConsent),
		};
	}

	async get(_id, params) {
		return userToConsent(await this.modelService.get(_id));
	}

	async create(data, params) {
		if (!{}.hasOwnProperty.call(data, 'userId')) {
			throw BadRequest('Consent could only create with a UserId');
		}

		const { userId, ...consent } = data;

		const oldUser = await this.modelService.get(userId);
		const newConsentData = modifyDataForUserSchema({ ...oldUser.consent, ...consent });

		const user = await this.modelService.patch(userId, newConsentData);

		return userToConsent(user);
	}

	async patch(_id, data, params) {
		return userToConsent(await this.modelService.patch(_id, modifyDataForUserSchema(data)));
	}

	async update(_id, data, params) {
		return userToConsent(await this.modelService.patch(_id, modifyDataForUserSchema(data)));
	}

	async remove(_id, params) {
		return userToConsent(
			await this.modelService.patch(_id, {
				query: {
					$unset: 'constent',
				},
			})
		);
	}

	setup(app) {
		this.app = app;
		this.modelService = this.app.service('usersModel');
	}
}

module.exports = {
	ConsentService,
	consentHooks,
};
