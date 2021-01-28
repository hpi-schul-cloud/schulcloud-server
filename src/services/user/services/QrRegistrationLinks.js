const { authenticate } = require('@feathersjs/authentication').hooks;

const { BadRequest } = require('../../../errors');
const { hasPermission, restrictToCurrentSchool } = require('../../../hooks');

class QrRegistrationLinks {
	constructor(userModel) {
		this.userModel = userModel;
		this.err = Object.freeze({
			failed: 'Can not generate QR registration links',
		});
	}

	async create(data) {
		try {
			const validUserIds = await this.getValidUserIds(data);
			const userWithoutAccount = await this.getUsersIdsWithoutAccount(validUserIds);
			if (!userWithoutAccount.length) {
				return [];
			}
			const regLinkServiceParams = this.getRegistrationLinkServiceParams(data);
			const result = await this.generateQrRegistrationLinks(userWithoutAccount, regLinkServiceParams);
			return result;
		} catch (err) {
			throw new BadRequest(this.err.failed, err);
		}
	}

	getRegistrationLinkServiceParams(data) {
		const { save = true, patchUser = true, host } = data;
		return { save, patchUser, host };
	}

	getUserDetails(userIdChunk) {
		return this.userModelService.find({
			query: {
				_id: userIdChunk,
				$populate: 'roles',
			},
		});
	}

	async getHashLinks(userDetailList, regLinkServiceParams) {
		const promiseList = [];
		for (const user of userDetailList) {
			promiseList.push(
				this.registrationLinkService
					.create({
						...regLinkServiceParams,
						role: user.roles[0].name,
						schoolId: user.schoolId,
						toHash: user.email,
						hash: user.importHash,
					})
					.then(({ shortLink, hash }) => {
						return {
							hash,
							email: user.email,
							qrContent: shortLink,
							firstName: user.firstName,
							lastName: user.lastName,
							title: `${user.firstName} ${user.lastName}`,
							description: 'Zum Registrieren bitte den Link öffnen.',
						};
					})
			);
		}
		const result = await Promise.all(promiseList);
		return result;
	}

	async getUserHashes(userIdChunk, regLinkServiceParams) {
		const userDetailList = await this.getUserDetails(userIdChunk);
		return this.getHashLinks(userDetailList.data, regLinkServiceParams);
	}

	async generateQrRegistrationLinks(userIds, regLinkServiceParams) {
		const qrRegistrationLinks = [];
		const chunkSize = 100;
		for (let index = 0; index < userIds.length; index += chunkSize) {
			const temparray = userIds.slice(index, index + chunkSize);
			// it is a bulk call - therefore it is OK to wait
			// eslint-disable-next-line no-await-in-loop
			const partResult = await this.getUserHashes(temparray, regLinkServiceParams);
			qrRegistrationLinks.push(...partResult);
		}

		return qrRegistrationLinks;
	}

	getValidUserIds(data) {
		const { selectionType, userIds: inputUserIds, schoolId, roleName } = data;
		if (roleName && roleName !== 'student' && roleName !== 'teacher') {
			throw new BadRequest('The given role is not supported');
		}

		const userIds = this.isInclusive(selectionType) ? inputUserIds : { $nin: inputUserIds };
		return this.userModelService
			.find({
				query: { _id: userIds, schoolId },
				paginate: false,
			})
			.then((users) => users.map((user) => String(user.id)));
	}

	async getUsersIdsWithoutAccount(userIds) {
		const accounts = await this.accountService.find({
			query: {
				userId: userIds,
			},
		});
		const accountsIds = accounts.map((account) => String(account.userId));
		return userIds.reduce((ids, id) => {
			if (!accountsIds.includes(id)) {
				ids.push(id);
			}
			return ids;
		}, []);
	}

	isInclusive(selectionType) {
		return selectionType === 'inclusive';
	}

	setup(app) {
		this.app = app;
		this.accountService = app.service('/accounts');
		this.registrationLinkService = app.service('/registrationlink');
		this.userModelService = app.service('usersModel');
	}
}

const qrRegistrationLinksHooks = {
	before: {
		all: [authenticate('jwt'), hasPermission(['STUDENT_LIST', 'TEACHER_LIST']), restrictToCurrentSchool],
	},
};

module.exports = {
	qrRegistrationLinksHooks,
	QrRegistrationLinks,
};
