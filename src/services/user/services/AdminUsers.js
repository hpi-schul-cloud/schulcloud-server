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
			const users = await getAllUsers(schoolId, currentYear, searchedRole._id, query);

			// filter students' latest class and return students filtered by class query
			if (params.headers.referer.includes('students')) {
				users.data.forEach((student) => {
					student.classes = student.classes.sort(
						(a, b) => b.match(/\d+/) - a.match(/\d+/),
					)[0];
				});
				if (query.classes) {
					return {
						...users,
						data: users.data.filter((student) => query.classes.includes(student.classes)),
					};
				}
			}

			return users;
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
