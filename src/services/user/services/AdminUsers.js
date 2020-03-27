/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { authenticate } = require('@feathersjs/authentication').hooks;
const logger = require('../../../logger');
const { createMultiDocumentAggregation } = require('../../consent/utils/aggregations');
const {
	hasSchoolPermission,
} = require('../../../hooks');

const { userModel } = require('../model');
const { RoleModel } = require('../../role/model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getRoles = () => RoleModel.find()
	.select('name')
	.lean()
	.exec();


const getAllUsers = async (schoolId, schoolYearId, role, clientQuery = {}) => {
	const query = {
		schoolId,
		roles: role,
		schoolYearId,
		consentStatus: clientQuery.consentStatus,
		sort: clientQuery.$sort || clientQuery.sort,
		select: [
			'consentStatus',
			'consent',
			'classes',
			'firstName',
			'lastName',
			'email',
			'createdAt',
			'importHash',
			'birthday',
		],
		skip: clientQuery.$skip || clientQuery.skip,
		limit: clientQuery.$limit || clientQuery.limit,
	};
	if (clientQuery.classes) query.classes = clientQuery.classes;
	if (clientQuery.createdAt) query.createdAt = clientQuery.createdAt;
	if (clientQuery.firstName) query.firstName = clientQuery.firstName;
	if (clientQuery.lastName) query.lastName = clientQuery.lastName;

	return new Promise((resolve, reject) => userModel.aggregate(createMultiDocumentAggregation(query)).option({
		collation: { locale: 'de', caseLevel: true },
	}).exec((err, res) => {
		if (err) reject(err);
		else resolve(res[0]);
	}));
};

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

			// fetch base data
			const [currentUser, roles] = await Promise.all([getCurrentUserInfo(currentUserId), getRoles()]);

			// permission check
			if (!currentUser.roles.some((role) => this.rolesThatCanAccess.includes(role.name))) {
				throw new Forbidden();
			}
			const { schoolId } = currentUser;
			const currentYear = await getCurrentYear(this, schoolId);

			// fetch data that are scoped to schoolId
			const searchedRole = roles.find((role) => role.name === this.role);
<<<<<<< refs/remotes/origin/develop
			return getAllUsers(schoolId, currentYear, searchedRole._id, query);
=======
			const [usersData, classes] = await Promise.all([
				getAllUsers(this, schoolId, searchedRole._id, query),
				getClasses(this.app, schoolId, currentYear),
			]);
			const { total, limit } = usersData;
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
				limit: $limit || limit,
				skip: $skip || 0,
				data: filteredUsers,
			};
>>>>>>> fix and clear some small issus
		} catch (err) {
			logger.error(err);
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

const adminHookGenerator = (kind) => ({
	before: {
		all: [authenticate('jwt')],
		find: [hasSchoolPermission(`${kind}_LIST`)],
		get: [hasSchoolPermission(`${kind}_LIST`)],
		create: [hasSchoolPermission(`${kind}_CREATE`)],
		update: [hasSchoolPermission(`${kind}_EDIT`)],
		patch: [hasSchoolPermission(`${kind}_EDIT`)],
		remove: [hasSchoolPermission(`${kind}_DELETE`)],
	},
});


module.exports = {
	AdminUsers,
	adminHookGenerator,
};
