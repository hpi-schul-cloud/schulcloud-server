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
		logger.debug(`Incoming ${content.action} ${content.syncId}: ${JSON.stringify(content.data).substring(0, 100)}...`);
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
		const { ldapSchoolIdentifier, systems, name, syncId } = schoolData;
		const schools = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier, systems: { $in: systems } } });

		try {
			if (schools.total !== 0) {
				const schoolId = schools.data[0]._id;
				await this.app.service('schools').update({ _id: schoolId }, { $set: { name } });
			} else {
				await this.app.service('schools').create(schoolData);
			}
			return true;
		} catch (err) {
			logger.error('LDAP SYNC: error while update or add a school', { err, syncId });
			return false;
		}
	}

	async userAction(data) {
		const inputUser = data.user;
		const { schoolDn, systemId, ldapId } = inputUser;
		const schools = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: schoolDn, systems: { $in: systemId } } });
		if (schools.total !== 0) {
			const user = await this.app.service('usersModel').find({
				query: {
					ldapId,
					schoolId: schools.data[0]._id,
					$populate: ['roles'],
				},
			});
			try {
				if (user.total !== 0) {
					this.updateUser(inputUser, user.data[0], data.account);
				} else {
					this.createUser(inputUser, data.account, schools.data[0]);
				}
				return true;
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', { err, syncId: data.syncId });
				return false;
			}
		}
		return true;
	}

	updateUser(inputUser, user, account) {
		const updateObject = {};
		if (user.firstName !== inputUser.firstName) {
			updateObject.firstName = inputUser.firstName || ' ';
		}
		if (user.lastName !== inputUser.lastName) {
			updateObject.lastName = inputUser.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (user.email !== inputUser.email) {
			updateObject.email = inputUser.email;
		}
		if (user.ldapDn !== inputUser.ldapDn) {
			updateObject.ldapDn = inputUser.ldapDn;
		}
		// Role
		const userDataRoles = user.roles.map((r) => r.name);
		if (!_.isEqual(userDataRoles, inputUser.roles)) {
			updateObject.roles = inputUser.roles;
		}
		if (!_.isEmpty(updateObject)) {
			this.app.service('users').patch(user._id, updateObject);
			accountModel.update(
				{ userId: user._id, systemId: account.systemId },
				{
					username: account.username,
					userId: user._id,
					systemId: account.systemId,
					activated: true,
				},
				{ upsert: true }
			);
		}
	}

	createUser(inputUser, account, school) {
		this.app
			.service('users')
			.create({
				firstName: inputUser.firstName,
				lastName: inputUser.lastName,
				schoolId: school._id,
				email: inputUser.email,
				ldapDn: inputUser.ldapDn,
				ldapId: inputUser.ldapId,
				roles: inputUser.roles,
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

	async classAction(inputClass) {
		const { schoolDn, systemId, ldapDn, className } = inputClass;
		const school = await this.app
			.service('schools')
			.find({ query: { ldapSchoolIdentifier: schoolDn, systems: { $in: systemId } } });
		const existingClasses = await this.app.service('classes').find({
			query: {
				year: school.currentYear,
				ldapDN: ldapDn,
			},
		});
		if (existingClasses.total === 0) {
			const newClass = {
				name: className,
				schoolId: school._id,
				nameFormat: 'static',
				ldapDN: ldapDn,
				year: school.currentYear,
			};
			await this.app.service('classes').create(newClass);
		} else {
			const existingClass = existingClasses.data[0];
			if (existingClass.name !== className) {
				await this.app.service('classes').patch(existingClass._id, { name: className });
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
			.then(() => {
				return true;
			})
			.catch((err) => {
				logger.error('LDAP SYNC: error while handling Stuff', { err, syncId: incomingMessage.syncId });
				return false;
			})
			.finally(() => syncQueue.ackMessage(incomingMessage));

	syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = setupConsumer;
