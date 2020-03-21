/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const logger = require('../../../logger');

const { userModel } = require('../model');
const roleModel = require('../../role/model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getAllUsers = (ref, schoolId, role, sortObject) => ref.app.service('users').find({
	query: {
		schoolId,
		roles: role.toString(),
		$limit: sortObject.$limit,
		$skip: sortObject.$skip,
		$sort: sortObject.$sort,
		$select: ['firstName', 'lastName', 'email', 'createdAt', 'importHash'],
	},
});

const getRoles = () => roleModel.find()
	.select('name')
	.lean()
	.exec();

const getClasses = (app, schoolId, schoolYearId) => app.service('classes')
	.find({
		query: {
			schoolId,
			$or: [
				{ year: schoolYearId },
				{ year: { $exists: false } },
			],
			$limit: 1000,
		},
	})
	.then((classes) => classes.data)
	.catch((err) => {
		logger.warning(`Can not execute app.service("classes").find for ${schoolId}`, err);
		return err;
	});

const findConsents = (ref, userIds, $limit) => ref.app.service('/consents')
	.find({
		query: {
			userId: { $in: userIds },
			$limit,
			$select: [
				'userId',
				'userConsent.form',
				'userConsent.privacyConsent',
				'userConsent.termsOfUseConsent',
				'parentConsents.parentId',
				'parentConsents.form',
				'parentConsents.privacyConsent',
				'parentConsents.termsOfUseConsent'],
		},
	})
	.then((consents) => consents.data);

class AdminUsers {
	constructor(role) {
		this.role = role || {};
		this.docs = {};
	}

	async find(params) {
		try {
			const currentUserId = params.account.userId.toString();

			// fetch base data
			const [currentUser, roles] = await Promise.all([getCurrentUserInfo(currentUserId), getRoles()]);
			const { schoolId } = currentUser;

			const currentSchool = await this.app.service('schools').get(schoolId);
			const { currentYear } = currentSchool;

			// permission check
			if (!currentUser.roles.some((role) => ['teacher', 'administrator', 'superhero'].includes(role.name))) {
				throw new Forbidden();
			}
			// fetch data that are scoped to schoolId
			const studentRole = (roles.filter((role) => role.name === this.role))[0];
			const [usersData, classes] = await Promise.all([
				getAllUsers(this, schoolId, studentRole._id, (params.query || {})),
				getClasses(this.app, schoolId, currentYear),
			]);
			const { total } = usersData;
			const users = usersData.data;
			const userIds = users.map((user) => user._id.toString());
			const consents = await findConsents(this, userIds, (params.query || {}).$limit).then((data) => {
				// rebuild consent to object for faster sorting
				const out = {};
				data.forEach((e) => {
					out[e.userId.toString()] = e;
				});
				return out;
			});
			// bsonId to stringId that it can use .includes for is in test
			classes.forEach((c) => {
				if (Array.isArray(c.userIds)) {
					c.userIds = c.userIds.map((id) => id.toString());
				} else {
					c.userIds = [];
				}
				if (Array.isArray(c.teacherIds)) {
					c.teacherIds = c.teacherIds.map((id) => id.toString());
				} else {
					c.teacherIds = [];
				}
			});

			// patch classes and consent into user
			users.map((user) => {
				user.classes = [];
				const userId = user._id.toString();
				user.consent = consents[userId] || {};
				classes.forEach((c) => {
					if (c.userIds.includes(userId) || c.teacherIds.includes(userId)) {
						user.classes.push(c.displayName);
					}
				});
				return user;
			});

			// sorting by class and by consent is implemented manually,
			// as classes and consents are fetched from seperate db collection
			const classSortParam = (((params.query || {}).$sort || {}).class || {}).toString();
			if (classSortParam === '1') {
				users.sort((a, b) => (a.classes[0] || '').toLowerCase() > (b.classes[0] || '').toLowerCase());
			} else if (classSortParam === '-1') {
				users.sort((a, b) => (a.classes[0] || '').toLowerCase() < (b.classes[0] || '').toLowerCase());
			}

			const sortOrder = {
				ok: 1,
				parentsAgreed: 2,
				missing: 3,
			};
			const consentSortParam = (((params.query || {}).$sort || {}).consent || {}).toString();
			if (consentSortParam === '1') {
				users.sort((a, b) => (sortOrder[a.consent.consentStatus || 'missing']
					- sortOrder[b.consent.consentStatus || 'missing']));
			} else if (consentSortParam === '-1') {
				users.sort((a, b) => (sortOrder[b.consent.consentStatus || 'missing']
					- sortOrder[a.consent.consentStatus || 'missing']));
			}

			const filteredUsers = users.filter((user) => {
				const { consentStatus } = params.query || {};

				if ((consentStatus || {}).$in) {
					const userStatus = user.consent.consentStatus || 'missing';
					return consentStatus.$in.includes(userStatus);
				}
				return true;
			});

			return {
				total,
				limit: (params.query || {}).$limit,
				skip: (params.query || {}).$skip,
				data: filteredUsers,
			};
		} catch (err) {
			logger.warning(err);
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this.');
			}
			throw new BadRequest('Can not fetch data.');
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = AdminUsers;
