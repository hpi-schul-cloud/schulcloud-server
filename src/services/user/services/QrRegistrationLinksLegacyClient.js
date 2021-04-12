const { authenticate } = require('@feathersjs/authentication').hooks;
const { hasPermission, restrictToCurrentSchool } = require('../../../hooks');
const { BadRequest } = require('../../activation/utils/generalUtils');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

class QrRegistrationLinksLegacyClient {
	constructor(userModel) {
		this.userModel = userModel;
		this.err = Object.freeze({
			failed: 'Can not generate QR registration links',
		});
	}

	async create(data, params) {
		const { classId, role, schoolId } = data;
		const inputUserIds = await this.getUserIds(classId, schoolId);
		const generateLinkServiceParams = this.getGenerateLinkServiceParams(data);
		const selectionType = (classId && 'inclusive') || 'exclusive';
		const roleName = role || (classId && 'student');
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
			const classItem = await this.classService.get(classId, {
				query: {
					$populate: { path: 'userIds', select: ['_id', 'lastName', 'fullName'] },
				},
				paginate: false,
			});
			if (!equalIds(classItem.schoolId, schoolId)) {
				throw new BadRequest(`ClassId does match user's school`);
			}

			userIds = [...classItem.userIds];
		}

		return userIds;
	}

	setup(app) {
		this.app = app;
		this.classService = app.service('/classes');
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
