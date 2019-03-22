/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('feathers-errors');
const logger = require('winston');

const { userModel } = require('../model');
const roleModel = require('../../role/model');
const { consentModel } = require('../../consent/model');

const getCurrentUser = id => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getAllUsers = (schoolId, roles) => userModel.find({ schoolId, roles })
	.select('firstName lastName email createdAt')
	.lean()
	.exec();

const getRoles = () => roleModel.find()
	.select('name')
	.lean()
	.exec();

const getClasses = (ref, schoolId) => ref.app.service('classes')
	.find({
		query: {
			schoolId,
			$limit: 1000,
			$select: 'userIds name',
		},
	})
	.then(classes => classes.data);

const findConsent = userIds => consentModel.find({ userId: { $in: userIds } })
	.select({
		'userConsent.dateOfPrivacyConsent': 0,
		'userConsent.dateOfTermsOfUseConsent': 0,
		'userConsent.dateOfThirdPartyConsent': 0,
		'userConsent.dateOfResearchConsent': 0,
		'userConsent.researchConsent': 0,
		'parentConsents.dateOfPrivacyConsent': 0,
		'parentConsents.dateOfTermsOfUseConsent': 0,
		'parentConsents.dateOfThirdPartyConsent': 0,
		'parentConsents.dateOfResearchConsent': 0,
		'parentConsents.researchConsent': 0,
	})
	.lean()
	.exec();

class AdminStudents {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find(params) {
	//	const { app } = this;
		try {
			const currentUserId = params.account.userId.toString();

			// fetch base data
			const [currentUser, roles] = await Promise.all([getCurrentUser(currentUserId), getRoles()]);
			const { schoolId } = currentUser;

			// permission check
			if (!currentUser.roles.some(role => ['teacher', 'administrator', 'superhero'].includes(role.name))) {
				throw new Forbidden();
			}

			// fetch data that are scoped to schoolId
			const studentRole = (roles.filter(role => role.name === 'student'))[0];
			const [users, classes] = await Promise.all([getAllUsers(schoolId, studentRole._id), getClasses(this, schoolId)]);
			const userIds = users.map(user => user._id.toString());
			const consents = await findConsent(userIds).then((data) => {
				// rebuild consent to object for faster sorting
				const out = {};
				data.forEach((e) => {
					out[e.userId.toString()] = e;
				});
				return out;
			});

			// bsonId to stringId that it can use .includes for is in test
			classes.forEach((c) => {
				c.userIds = c.userIds.map(id => id.toString());
			});

			// patch classes and consent into user
			return users.map((user) => {
				user.classes = [];
				const userId = user._id.toString();
				const con = consents[userId];
				if (con) {
					user.consent = con;
				}
				classes.forEach((c) => {
					if (c.userIds.includes(userId)) {
						user.classes.push(c.name);
					}
				});
				return user;
			});
		} catch (err) {
			logger.warn(err);
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

module.exports = AdminStudents;
