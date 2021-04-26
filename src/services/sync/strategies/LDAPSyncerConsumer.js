const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const logger = require('../../../logger');
const { UserRepo, ClassRepo, SchoolRepo } = require('../repo');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
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
				throw new BadRequest(`${content.action} is not valid message action`);
			}
		}
	}

	async schoolAction(schoolData) {
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);

		try {
			if (school !== null) {
				if (school.name !== schoolData.name) {
					await SchoolRepo.updateSchoolName(school._id, schoolData.name);
				}
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
		const { user: userData, account: accountData, syncId } = data;
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(userData.schoolDn, userData.systemId);
		if (school !== null) {
			const foundUser = await UserRepo.findByLdapIdAndSchool(userData.ldapId, school._id);
			try {
				if (foundUser !== null) {
					await this.updateUserAndAccount(foundUser, userData, accountData);
				} else {
					await this.createUserAndAccount(userData, accountData, school._id);
				}
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', { err, syncId });
				throw err;
			}
			return true;
		}
		return false;
	}

	async updateUserAndAccount(user, userData, account) {
		const updateObject = {};
		if (userData.firstName !== user.firstName) {
			updateObject.firstName = userData.firstName || ' ';
		}
		if (userData.lastName !== user.lastName) {
			updateObject.lastName = userData.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (userData.email !== user.email) {
			updateObject.email = userData.email;
		}
		if (userData.ldapDn !== user.ldapDn) {
			updateObject.ldapDn = userData.ldapDn;
		}
		// Role
		const userRoles = user.roles && user.roles.map((r) => r.name);
		if (!_.isEqual(userRoles, userData.roles)) {
			updateObject.roles = userData.roles;
		}
		if (!_.isEmpty(updateObject)) {
			return UserRepo.updateUserAndAccount(user._id, updateObject, account);
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
			const existingClass = await ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDN);
			try {
				if (existingClass !== null) {
					if (existingClass.name !== classData.name) {
						await ClassRepo.updateClassName(existingClass._id, classData.name);
					}
				} else {
					const newClass = {
						name: classData.name,
						schoolId: school._id,
						nameFormat: 'static',
						ldapDN: classData.ldapDN,
						year: school.currentYear,
					};
					await ClassRepo.createClass(newClass);
				}
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a class', { err, syncId: classData.syncId });
				throw err;
			}

			return true;
		}
		return false;
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
