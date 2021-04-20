const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const logger = require('../../../logger');
const { UserRepo, ClassRepo, SchoolRepo } = require('../repo');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
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
				throw new BadRequest(`${content.action} is not valid message action`);
			}
		}
	}

	async schoolAction(schoolData) {
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);

		try {
			if (school !== null) {
				const schoolId = school._id;
				await SchoolRepo.updateSchoolName(schoolId, schoolData.name);
			} else {
				await SchoolRepo.createSchool(schoolData);
			}
			return true;
		} catch (err) {
			logger.error('LDAP SYNC: error while update or add a school', { err, syncId: schoolData.syncId });
			throw err;
		}
	}

	async userAction(data) {
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(data.user.schoolDn, data.user.systemId);
		if (school !== null) {
			const userData = await UserRepo.findByLdapIdAndSchool(data.user.ldapId, school._id);
			try {
				if (userData.total !== 0) {
					return this.updateUserAndAccount(data.user, userData.data[0], data.account);
				}
				return this.createUserAndAccount(data.user, data.account, school._id);
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', { err, syncId: data.syncId });
				throw err;
			}
		}
		return true;
	}

	async updateUserAndAccount(user, userData, account) {
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
			return UserRepo.updateUserAndAccount(userData._id, updateObject, account);
		}
		return true;
	}

	async createUserAndAccount(idmUser, account, schoolId) {
		try {
			idmUser.schoolId = schoolId;
			return UserRepo.createUserAndAccount(idmUser, account);
		} catch (err) {
			logger.error('LDAP SYNC: error while creating User', err);
			throw err;
		}
	}

	async classAction(classData) {
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

		if (school !== null) {
			const existingClass = await ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDn);
			try {
				if (existingClass === null) {
					const newClass = {
						name: classData.className,
						schoolId: school._id,
						nameFormat: 'static',
						ldapDN: classData.ldapDn,
						year: school.currentYear,
					};
					await ClassRepo.createClass(newClass);
				} else if (existingClass.name !== classData.className) {
					await ClassRepo.updateClassName(existingClass._id, classData.className);
				}
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a class', { err, syncId: classData.syncId });
				throw err;
			}

			return true;
		}
		return true;
	}
}

const setupConsumer = () => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	const consumer = new LDAPSyncerConsumer();

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

	return syncQueue.consumeQueue(handleMessage, { noAck: false });
};

module.exports = {
	consumer: setupConsumer,
	LDAPSyncerConsumer,
};
