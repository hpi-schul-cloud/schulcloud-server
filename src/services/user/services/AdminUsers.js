/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const logger = require('winston');

const { userModel } = require('../model');
const roleModel = require('../../role/model');

const getCurrentUser = id => userModel.findById(id)
	.select('schoolId')
	.populate('roles')
	.lean()
	.exec();

const getAllUsers = (schoolId, roles, sortObject) => userModel.find({ schoolId, roles })
	.select('firstName lastName email createdAt')
	.sort(sortObject)
	.lean()
	.exec();

const getRoles = () => roleModel.find()
	.select('name')
	.lean()
	.exec();

const getClasses = (app, schoolId) => app.service('classes')
	.find({
		query: {
			schoolId,
			$limit: 1000,
		},
	})
	.then(classes => classes.data)
	.catch((err) => {
		logger.warn(`Can not execute app.service("classes").find for ${schoolId}`, err);
		return err;
	});

const findConsents = (ref, userIds) => ref.app.service('/consents')
	.find({
		query: {
			userId: { $in: userIds },
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
	.then(consents => consents.data);

class AdminUsers {
	constructor(role) {
		this.role = role || {};
		this.docs = {};
	}

	async find(params) {
		//  const { app } = this;
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
			const studentRole = (roles.filter(role => role.name === this.role))[0];
			const [users, classes] = await Promise.all(
				[
					getAllUsers(schoolId, studentRole._id, (params.query || {}).$sort),
					getClasses(this.app, schoolId),
				],
			);

			const userIds = users.map(user => user._id.toString());
			const consents = await findConsents(this, userIds).then((data) => {
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
			users.map((user) => {
				user.classes = [];
				const userId = user._id.toString();
				user.consent = consents[userId] || {};
				classes.forEach((c) => {
					if (c.userIds.includes(userId)) {
						user.classes.push(c.displayName);
					}
				});
				return user;
			});

			const filteredUsers = users.filter((user) => {
				const { consentStatus } = params.query || {};

				if ((consentStatus || {}).$in) {
					const userStatus = user.consent.consentStatus || 'missing';
					return consentStatus.$in.includes(userStatus);
				}
				return true;
			});
			return filteredUsers;
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

module.exports = AdminUsers;
