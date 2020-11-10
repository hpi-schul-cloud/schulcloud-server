const { authenticate } = require('@feathersjs/authentication').hooks;
const { hasPermission, restrictToCurrentSchool } = require('../../../hooks');

class QrRegistrationLinksLegacyClient {
	constructor(userModel) {
		this.userModel = userModel;
		this.err = Object.freeze({
			failed: 'Can not generate QR registration links',
		});
	}

	async create(data, params) {
		const { classId, role: roleName, schoolId } = data;
		const inputUserIds = await this.getUserIds(classId, schoolId);
		const generateLinkServiceParams = this.getGenerateLinkServiceParams(data);
		const selectionType = inputUserIds.length === 0 ? 'exclusive' : 'inclusive';
		return this.qrLinkServiceNew
			.create(
				{
					userIds: inputUserIds,
					roleName,
					selectionType,
					...generateLinkServiceParams,
				},
				params
			)
			.then(this.mapResults);
	}

	mapResults(results) {
		return results.map((qrLinkResult) => {
			const { firstName, lastName, email, hash, qrContent: shortLink } = qrLinkResult;
			return { firstName, lastName, email, hash, registrationLink: { shortLink } };
		});
	}

	getGenerateLinkServiceParams(data) {
		// save, patchUser. host,
		const { save, patchUser, host } = data;
		return { save, patchUser, host };
	}

	async getUserIds(classId, schoolId) {
		let userIds = [];
		if (classId) {
			// TODO Test it!
			const classItem = await this.classService.find({
				query: {
					classId,
					schoolId,
					$populate: { path: 'userIds', select: ['_id', 'lastName', 'fullName'] },
				},
				paginate: false,
			});
			userIds = { ...classItem.userIds };
		}

		return userIds;
	}

	setup(app) {
		this.app = app;
		this.classService = app.service('/class');
		this.qrLinkServiceNew = app.service('users/qrRegistrationLink');
	}
}

const qrRegistrationLinksLegacyHooks = {
	before: {
		all: [authenticate('jwt'), hasPermission(['STUDENT_LIST', 'TEACHER_LIST']), restrictToCurrentSchool],
	},
};

module.exports = {
	qrRegistrationLinksLegacyHooks,
	QrRegistrationLinksLegacyClient,
};
