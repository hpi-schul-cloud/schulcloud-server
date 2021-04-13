const _ = require('lodash');
const { getChannel } = require('../../../utils/rabbitmq');
const logger = require('../../../logger');
const { ClassRepo, UserRepo, AccountRepo } = require('../repo');
const schoolRepo = require('../../../components/school/repo/school.repo');

const { BadRequest } = require('../../../errors');

const { LDAP_SYNC_ACTIONS, LDAP_SYNC_CHANNEL_NAME } = require('./LDAPSyncer');

class LDAPSyncerConsumer {
	constructor(classRepo, userRepo, accountRepo) {
		this.classRepo = classRepo;
		this.userRepo = userRepo;
		this.accountRepo = accountRepo;
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
				throw new BadRequest(`${content.action} is not valid message action`);
			}
		}
	}

	async schoolAction(schoolData) {
		const school = await schoolRepo.findByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);

		try {
			if (school !== undefined) {
				const schoolId = school._id;
				await schoolRepo.updateName(schoolId, schoolData.name);
			} else {
				await schoolRepo.create(schoolData);
			}
			return true;
		} catch (err) {
			logger.error('LDAP SYNC: error while update or add a school', { err, syncId: schoolData.syncId });
			throw err;
		}
	}

	async userAction(data) {
		const school = await schoolRepo.findByLdapIdAndSystem(data.user.schoolDn, data.user.systemId);
		if (school !== undefined) {
			const userData = await this.userRepo.findByLdapIdAndSchool(data.user.ldapId, school._id);
			try {
				if (userData.total !== 0) {
					this.updateUser(data.user, userData.data[0], data.account);
				} else {
					await this.createUser(data.user, data.account, school._id);
				}
				return true;
			} catch (err) {
				logger.error('LDAP SYNC: error while update or add a user', { err, syncId: data.syncId });
				throw err;
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
			this.userRepo.patch(userData._id, updateObject);
			this.accountRepo.update(userData._id, account);
		}
	}

	async createUser(idmUser, account, schoolId) {
		try {
			const user = await this.userRepo.create(idmUser, account, schoolId);
			await this.accountRepo.create(user._id, account);
		} catch (err) {
			logger.error('LDAP SYNC: error while creating User', err);
			throw err;
		}
	}

	async classAction(classData) {
		const school = await schoolRepo.findByLdapIdAndSystem(classData.schoolDn, classData.systemId);
		const existingClasses = await this.classRepo.findByYearAndLdapDn(school.currentYear, classData.ldapDn);

		if (existingClasses.total === 0) {
			const newClass = {
				name: classData.className,
				schoolId: school._id,
				nameFormat: 'static',
				ldapDN: classData.ldapDn,
				year: school.currentYear,
			};
			this.classRepo.create(newClass);
		} else {
			const existingClass = existingClasses.data[0];
			if (existingClass.name !== classData.className) {
				this.classRepo.updateName(existingClass._id, classData.className);
			}
		}
	}
}

const setupConsumer = (app) => {
	const syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	const classRepo = new ClassRepo(app);
	const userRepo = new UserRepo(app);
	const accountRepo = new AccountRepo(app);
	const consumer = new LDAPSyncerConsumer(classRepo, userRepo, accountRepo);

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

module.exports = {
	consumer: setupConsumer,
	LDAPSyncerConsumer,
};
