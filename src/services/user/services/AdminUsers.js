/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const logger = require('../../../logger');

const { userModel } = require('../model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getAllUsers = (ref, schoolId, role, sortObject) => ref.app.service('usersModel').find({
	query: {
		schoolId,
		roles: role.toString(),
		$limit: sortObject.$limit,
		$skip: sortObject.$skip,
		$sort: sortObject.$sort,
		$select: ['firstName', 'lastName', 'email', 'createdAt', 'importHash', 'birthday'],
	},
});
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

const getCurrentYear = (ref, schoolId) => ref.app.service('schools')
	.get(schoolId, {
		query: { $select: ['currentYear'] },
	})
	.then(({ currentYear }) => currentYear.toString());

class AdminUsers {
	constructor(role) {
		this.role = role || {};
		this.docs = {};
		this.rolesThatCanAccess = ['teacher', 'administrator', 'superhero'];
	}

	async find(params) {
		try {
			const { query, account } = params;
			const currentUserId = account.userId.toString();
			const {
				$limit,
				$skip,
				$sort,
				consentStatus,
			} = query;

			// fetch base data
			const getRoles = this.app.service('roles').find().then((roles) => roles.data);
			const [currentUser, roles] = await Promise.all([getCurrentUserInfo(currentUserId), getRoles()]);

			// permission check
			if (!currentUser.roles.some((role) => this.rolesThatCanAccess.includes(role.name))) {
				throw new Forbidden();
			}
			const { schoolId } = currentUser;
			const currentYear = await getCurrentYear(this, schoolId);

			// fetch data that are scoped to schoolId
			const searchedRole = roles.find((role) => role.name === this.role);
			const [usersData, classes] = await Promise.all([
				getAllUsers(this, schoolId, searchedRole._id, query),
				getClasses(this.app, schoolId, currentYear),
			]);
			const { total } = usersData;
			const users = usersData.data;
			const userIds = users.map((user) => user._id.toString());
			const consents = await findConsents(this, userIds, $limit).then((data) => {
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
			users.forEach((user) => {
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
			const classSortParam = (($sort || {}).class || {}).toString();
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
			const consentSortParam = (($sort || {}).consent || {}).toString();
			if (consentSortParam === '1') {
				users.sort((a, b) => (sortOrder[a.consent.consentStatus || 'missing']
					- sortOrder[b.consent.consentStatus || 'missing']));
			} else if (consentSortParam === '-1') {
				users.sort((a, b) => (sortOrder[b.consent.consentStatus || 'missing']
					- sortOrder[a.consent.consentStatus || 'missing']));
			}

			const filteredUsers = users.filter((user) => {
				if ((consentStatus || {}).$in) {
					const userStatus = user.consent.consentStatus || 'missing';
					return consentStatus.$in.includes(userStatus);
				}
				return true;
			});

			return {
				total,
				limit: $limit,
				skip: $skip,
				data: filteredUsers,
			};
		} catch (err) {
			if ((err || {}).code === 403) {
				throw new Forbidden('You have not the permission to execute this.', err);
			}
			throw new BadRequest('Can not fetch data.', err);
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = AdminUsers;
