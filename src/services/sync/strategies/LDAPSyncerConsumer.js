const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const accountModel = require('../../account/model');
const logger = require('../../../logger');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
	constructor(app) {
		this.app = app;
	}

	async executeMessage(incomingMessage) {
		const content = JSON.parse(incomingMessage.content.toString());
		switch (content.action) {
			case LDAP_SYNC_ACTIONS.SYNC_SCHOOL: {
				return this.schoolAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_USER: {
				return this.userAction(content.data);
			}

			case LDAP_SYNC_ACTIONS.SYNC_CLASSES: {
				return this.classAction(content.data);
			}

			default: {
				// message can't be processed
				return false;
			}
		}
	}

	async schoolAction(schoolData) {
		const schools = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: schoolData.ldapSchoolIdentifier, systems: { $in: schoolData.systems } } });

		try {
			if (schools.total !== 0) {
				await this.app.service('schools').update({ _id: schools.data[0]._id }, { $set: { name: schoolData.name } });
			} else {
				await this.app.service('schools').create(schoolData);
			}
			return true;
		} catch (err) {
			logger.error('LDAP SYNC: error while update or add a school', err);
			return false;
		}
	}

	async userAction(data) {
		const schools = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: data.user.schoolDn, systems: { $in: data.user.systemId } } });
		if (schools.total !== 0) {
			const userData = await this.app.service('usersModel').find({
				query: {
					ldapId: data.user.ldapId,
					schoolId: schools.data[0]._id,
					$populate: ['roles'],
				},
			});
			try {
				if (userData.total !== 0) {
					this.updateUser(data.user, userData.data[0], data.account);
				} else {
					this.createUser(data.user, data.account, schools.data[0]);
				}
				return true;
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', err);
				return false;
			}
		}
		return true;
	}

	updateUser(user, userData, account) {
		const updateObject = {};
		if (userData.firstName !== user.firstName) {
			updateObject.firstName = user.firstName || ' ';
		}
		if (userData.lastName !== user.lastName) {
			updateObject.lastName = user.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (userData.email !== user.email) {
			updateObject.email = user.email;
		}
		if (userData.ldapDn !== user.ldapDn) {
			updateObject.ldapDn = user.ldapDn;
		}
		// Role
		const userDataRoles = userData.roles.map((r) => r.name);
		if (!_.isEqual(userDataRoles, user.roles)) {
			updateObject.roles = user.roles;
		}
		if (!_.isEmpty(updateObject)) {
			this.app.service('users').patch(userData._id, updateObject);
			accountModel.update(
				{ userId: userData._id, systemId: account.systemId },
				{
					username: account.username,
					userId: userData._id,
					systemId: account.systemId,
					activated: true,
				},
				{ upsert: true }
			);
		}
	}

	createUser(idmUser, account, school) {
		this.app
			.service('users')
			.create({
				firstName: idmUser.firstName,
				lastName: idmUser.lastName,
				schoolId: school._id,
				email: idmUser.email,
				ldapDn: idmUser.ldapDn,
				ldapId: idmUser.ldapId,
				roles: idmUser.roles,
			})
			.then((user) =>
				accountModel.create({
					userId: user._id,
					username: account.username.toLowerCase(),
					systemId: account.systemId,
					activated: true,
				})
			)
			.catch((err) => logger.error('LDAP SYNC: error while creating User', err));
	}

	async classAction(classData) {
		const school = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: classData.schoolDn, systems: { $in: classData.systemId } } });
		const existingClasses = await this.app.service('classes').find({
			query: {
				year: school.currentYear,
				ldapDN: classData.ldapDn,
			},
		});
		if (existingClasses.total === 0) {
			const newClass = {
				name: classData.className,
				schoolId: school._id,
				nameFormat: 'static',
				ldapDN: classData.ldapDn,
				year: school.currentYear,
			};
			await this.app.service('classes').create(newClass);
		} else {
			const existingClass = existingClasses.data[0];
			if (existingClass.name !== classData.className) {
				await this.app.service('classes').patch(existingClass._id, { name: classData.className });
			}
		}
	}
}

const setupConsumer = (app) => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	const consumer = new LDAPSyncerConsumer(app);

	const handleMessage = (incomingMessage) =>
		consumer
			.executeMessage(incomingMessage)
			.then((success) => {
				if (success) {
					syncQueue.ackMessage(incomingMessage);
				} else {
					syncQueue.rejectMessage(incomingMessage, false);
				}
				return success;
			})
			.catch((err) => {
				logger.error('LDAP SYNC: error while handling Stuff', err);
				syncQueue.rejectMessage(incomingMessage, false);
				return false;
			});

	syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = setupConsumer;
