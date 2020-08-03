const { authenticate } = require('@feathersjs/authentication').hooks;
const { BadRequest } = require('@feathersjs/errors');
const { hasPermission } = require('../../../hooks');

class QrRegistrationLinks {
	constructor(userModel) {
		this.userModel = userModel;
		this.err = Object.freeze({
			failed: 'Can not generate QR registration links',
		});
	}

	async create(data) {
		let { userIds } = data;
		try {
			userIds = await this.getUsersIdsWithoutAccount(userIds);
			if (!userIds.length) {
				return [];
			}
			return this.generateQrRegistrationLinks(userIds);
		} catch (err) {
			throw new BadRequest(this.err.failed, err);
		}
	}

	async generateQrRegistrationLinks(userIds) {
		const qrRegistrationLinks = [];
		for (const userId of userIds) {
			const user = await this.getUserInfo(userId);
			const { shortLink } = await this.registrationLinkService.create({
				role: user.roles[0],
				save: true,
				patchUser: true,
				schoolId: user.schoolId,
				toHash: user.email,
			});
			qrRegistrationLinks.push({
				qrContent: shortLink,
				title: `${user.firstName} ${user.lastName}`,
				description: 'Zum Registrieren bitte den Link öffnen.',
			});
		}
		return qrRegistrationLinks;
	}

	getUserInfo(userId) {
		return this.app.service('usersModel').get(userId);
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

	setup(app) {
		this.app = app;
		this.accountService = app.service('/accounts');
		this.registrationLinkService = app.service('/registrationlink');
	}
}

const qrRegistrationLinksHooks = {
	before: {
		all: [authenticate('jwt'), hasPermission(['STUDENT_LIST', 'TEACHER_LIST'])],
	},
};

module.exports = {
	qrRegistrationLinksHooks,
	QrRegistrationLinks,
};
