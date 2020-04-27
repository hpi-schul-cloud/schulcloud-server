/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const logger = require('../../../logger');
const { createMultiDocumentAggregation } = require('../../consent/utils/aggregations');

const { userModel } = require('../model');
const roleModel = require('../../role/model');

const getCurrentUserInfo = (id) => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getRoles = () => roleModel.find()
	.select('name')
	.lean()
	.exec();


const getAllUsers = async (ref, schoolId, role, clientQuery = {}) => {
	const query = {
		schoolId,
		roles: role,
		consentStatus: clientQuery.consentStatus,
		sort: clientQuery.$sort || clientQuery.sort,
		select: ['consentStatus', 'consent', 'firstName', 'lastName', 'email', 'createdAt', 'importHash', 'birthday'],
		skip: clientQuery.$skip || clientQuery.skip,
		limit: clientQuery.$limit || clientQuery.limit,
	};
	if (clientQuery.createdAt) query.createdAt = clientQuery.createdAt;
	if (clientQuery.firstName) query.firstName = clientQuery.firstName;

	return userModel.aggregate(createMultiDocumentAggregation(query)).option({
		collation: { locale: 'de', caseLevel: true },
	}).exec();
};

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
			const [[usersData], classes] = await Promise.all([
				getAllUsers(this, schoolId, searchedRole._id, query),
				getClasses(this.app, schoolId, currentYear),
			]);

			const users = usersData.data;

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
				classes.forEach((c) => {
					if (c.userIds.includes(userId) || c.teacherIds.includes(userId)) {
						user.classes.push(c.displayName);
					}
				});
			});

			// sorting by class and by consent is implemented manually,
			// as classes and consents are fetched from seperate db collection
			const classSortParam = (((query || {}).$sort || {}).class || {}).toString();
			if (classSortParam === '1') {
				users.sort((a, b) => (a.classes[0] || '').toLowerCase() > (b.classes[0] || '').toLowerCase());
			} else if (classSortParam === '-1') {
				users.sort((a, b) => (a.classes[0] || '').toLowerCase() < (b.classes[0] || '').toLowerCase());
			}

			return {
				...usersData,
				data: users,
			};
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

module.exports = AdminUsers;
