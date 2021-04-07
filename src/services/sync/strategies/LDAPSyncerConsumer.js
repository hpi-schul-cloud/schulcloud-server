const { getChannel } = require('../../../utils/rabbitmq');
const accountModel = require('../../account/model');
const logger = require('../../../logger');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
	constructor(app) {
		this.app = app;
		this.syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
		this.syncQueue.consumeQueue(this.handleMessage, { noAck: false });
	}

	handleMessage(incomingMessage) {
		try {
			this.executeMessage(incomingMessage);
			this.syncQueue.ackMessage(incomingMessage);
			return true;
		} catch (err) {
			this.syncQueue.ackMessage(incomingMessage);
			logger.error('LDAP SYNC: error while handling Stuff', err);
			return false;
		}
	}

	executeMessage(incomingMessage) {
		const content = JSON.parse(incomingMessage.content.toString());
		switch (content.action) {
			case LDAP_SYNC_ACTIONS.SYNC_SCHOOL: {
				this.schoolAction(content.data);
				return true;
			}

			case LDAP_SYNC_ACTIONS.SYNC_USER: {
				this.userAction(content.data);
				return true;
			}

			case LDAP_SYNC_ACTIONS.SYNC_CLASSES: {
				this.classAction(content.data);
				return true;
			}

			default: {
				// message can't be processed
				return false;
			}
		}
	}

	schoolAction(schoolData) {
		this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: schoolData.ldapSchoolIdentifier, systems: { $in: schoolData.systems } } })
			.then((schools) => {
				if (schools.total !== 0) {
					this.app.service('schools').update({ _id: schools.data[0]._id }, { $set: { name: schoolData.name } });
				} else {
					this.app.service('schools').create(schoolData);
				}
				return true;
			})
			.catch((err) => logger.error('LDAP SYNC: error while update or add a school', err));
	}

	userAction(data) {
		const schools = this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: data.user.shoolDn, systems: { $in: data.user.systemId } } });
		if (schools.total !== 0) {
			const userData = this.app.service('usersModel').find({
				query: {
					ldapId: data.user.ldapId,
					schoolId: schools.data[0]._id,
					$populate: ['roles'],
				},
			});
			if (userData.total !== 0) {
				this.updateUser(data.user, userData, data.account);
			} else {
				this.createUser(data.user, data.account, schools.data[0]);
			}
		}
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
		updateObject.roles = user.roles;
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

	createUser(idmUser, account, school) {
		this.app
			.service('users')
			.create({
				firstName: idmUser.firstName,
				lastName: idmUser.lastName,
				schoolId: school._id,
				email: idmUser.email,
				ldapDn: idmUser.ldapDn,
				ldapId: idmUser.ldapUUID,
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

	classAction(classData) {
		const school = this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: classData.shoolDn, systems: { $in: classData.systemId } } });
		const existingClasses = this.app.service('classes').find({
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
			this.app.service('classes').create(newClass);
		} else {
			const existingClass = existingClasses.data[0];
			if (existingClass.name !== classData.className) {
				this.app.service('classes').patch(existingClass._id, { name: classData.className });
			}
		}
	}
}

module.exports = {
	LDAPSyncerConsumer,
};
