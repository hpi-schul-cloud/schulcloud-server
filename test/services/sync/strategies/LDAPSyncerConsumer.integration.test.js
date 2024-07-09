const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/SyncMessageBuilder');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { SchoolAction, UserAction, ClassAction } = require('../../../../src/services/sync/strategies/consumerActions');
const SchoolYearFacade = require('../../../../src/services/school/logic/year');

const { userModel } = require('../../../../src/services/user/model');

const { classModel } = require('../../../../src/services/user-group/model');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');
const { setupNestServices, closeNestServices } = require('../../../utils/setup.nest.services');
const { SyncError } = require('../../../../src/errors/applicationErrors');

const testObjects = require('../../helpers/testObjects')(appPromise());

const { expect } = chai;
chai.use(chaiAsPromised);

const ldapSchoolIDn = 'TEST_SCHOOL_LDAP_DN';
const ldapClassDn = 'TEST_CLASS_LDAP_DN';
const ldapUserDn = 'TEST_USER_LDAP_DN';
const accountUserName = 'TEST_ACCOUNT_UNAME';

describe('Ldap Syncer Consumer Integration', () => {
	let app;
	let server;
	let ldapConsumer;
	let nestServices;
	let accountService;
	let system;

	before(async () => {
		app = await appPromise();
		server = await app.listen(0);
		const shouldUseFilter = true;
		ldapConsumer = new LDAPSyncerConsumer(
			new SchoolAction(shouldUseFilter),
			new UserAction(app, shouldUseFilter),
			new ClassAction(shouldUseFilter)
		);
		nestServices = await setupNestServices(app);
		accountService = await app.service('nest-account-service');
	});

	beforeEach(async () => {
		system = await testObjects.createTestSystem();
	});

	afterEach(async () => {
		const account = accountService.findByUsernameAndSystemId(accountUserName, system._id);
		await accountService.deleteByUserId(account.userId);
		await userModel.deleteOne({ ldapDn: ldapUserDn }).lean().exec();
		await classModel.deleteOne({ ldapDN: ldapClassDn }).lean().exec();

		await schoolModel.deleteOne({ ldapSchoolIdentifier: ldapSchoolIDn }).lean().exec();
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('school messages', () => {
		it('should create school by the data', async () => {
			const schoolName = 'test school';
			const currentYear = {
				_id: '5ebd6dc14a431f75ec9a3e7a',
				name: '2024/25',
				startDate: '2024-08-01T00:00:00.000Z',
				endDate: '2025-07-31T00:00:00.000Z',
			};
			const states = await app.service('federalStates').find({ query: { abbreviation: 'NI' } });
			const federalStateId = states.data[0]._id;
			const contentData = {
				action: 'syncSchool',
				syncId: '6082d04c4f92b7557025df7b',
				data: {
					school: {
						name: schoolName,
						systems: [system._id],
						ldapSchoolIdentifier: ldapSchoolIDn,
						currentYear,
						federalState: federalStateId,
					},
				},
			};
			const schoolData = {
				content: JSON.stringify(contentData),
			};

			await ldapConsumer.executeMessage(schoolData);

			const foundSchool = await schoolModel.findOne({ ldapSchoolIdentifier: ldapSchoolIDn }).lean().exec();
			expect(foundSchool).to.be.not.null;
			expect(foundSchool.name).to.be.equal(schoolName);
			expect(foundSchool.federalState.toString()).to.be.equal(federalStateId.toString());
			expect(foundSchool.currentYear._id.toString()).to.be.equal(currentYear._id.toString());
		});

		it('should update existing school by the data', async () => {
			const initialSchoolName = 'Initial School Name';
			await testObjects.createTestSchool({
				name: initialSchoolName,
				ldapSchoolIdentifier: ldapSchoolIDn,
				systems: [system._id],
			});
			const updatedSchoolName = 'Updated School Name';
			const contentData = {
				action: 'syncSchool',
				syncId: '6082d04c4f92b7557025df7b',
				data: {
					school: {
						name: updatedSchoolName,
						systems: [system._id],
						ldapSchoolIdentifier: ldapSchoolIDn,
					},
				},
			};
			const schoolData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(schoolData);

			const foundSchool = await schoolModel.findOne({ ldapSchoolIdentifier: ldapSchoolIDn }).lean().exec();
			expect(foundSchool).to.be.not.null;
			expect(foundSchool.name).to.be.equal(updatedSchoolName);
		});
	});

	describe('user messages', () => {
		it('should create user by the data', async () => {
			const testEmail = `test${Date.now()}@example.com`;
			const firstName = 'test first';
			const lastName = 'test last';
			const ldapUserId = 'LDAP_USER_ID';

			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });

			const contentData = {
				action: 'syncUser',
				syncId: '6082d22395baca4f64ef0a1f',
				data: {
					user: {
						firstName,
						lastName,
						systemId: system._id,
						schoolDn: school.ldapSchoolIdentifier,
						email: testEmail,
						ldapDn: ldapUserDn,
						ldapId: ldapUserId,
						roles: ['student'],
					},
					account: {
						ldapDn: ldapUserDn,
						ldapId: ldapUserId,
						username: accountUserName,
						systemId: system._id,
						schoolDn: school.ldapSchoolIdentifier,
						activated: true,
					},
				},
			};

			const userData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(userData);

			const foundUser = await userModel.findOne({ ldapDn: ldapUserDn }).lean().exec();
			expect(foundUser).to.be.not.null;
			expect(foundUser.email).to.be.equal(testEmail);
			expect(foundUser.firstName).to.be.equal(firstName);
			expect(foundUser.lastName).to.be.equal(lastName);
			expect(foundUser.ldapId).to.be.equal(ldapUserId);
			expect(foundUser.ldapDn).to.be.equal(ldapUserDn);

			const foundAccount = await accountService.findByUserId(foundUser._id);
			expect(foundAccount).to.be.not.null;
			expect(foundAccount.username).to.be.equal(accountUserName.toLowerCase());
			expect(foundAccount.systemId.toString()).to.be.equal(system._id.toString());
			expect(foundAccount.activated).to.be.true;
		});

		it('should update existing user by the data', async () => {
			const initialFirstName = 'initial fname';
			const initialLastName = 'initial lname';
			const initialEmail = `initial_test${Date.now()}@example.com`;
			const updatedEmail = `test${Date.now()}@example.com`;
			const updatedFirstName = 'test first';
			const updatedLastName = 'test last';
			const ldapUserId = 'LDAP_USER_ID';

			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
			const user = await testObjects.createTestUser({
				ldapId: ldapUserId,
				firstName: initialFirstName,
				lastName: initialLastName,
				email: initialEmail,
				schoolId: school._id,
			});
			await testObjects.createTestAccount(
				{
					username: 'testUser',
					password: 'testPassword',
				},
				system,
				user
			);
			const contentData = {
				action: 'syncUser',
				syncId: '6082d22395baca4f64ef0a1f',
				data: {
					user: {
						firstName: updatedFirstName,
						lastName: updatedLastName,
						systemId: system._id,
						schoolDn: school.ldapSchoolIdentifier,
						email: updatedEmail,
						ldapDn: ldapUserDn,
						ldapId: ldapUserId,
						roles: ['student'],
					},
					account: {
						ldapDn: ldapUserDn,
						ldapId: ldapUserId,
						username: accountUserName,
						systemId: system._id,
						schoolDn: school.ldapSchoolIdentifier,
						activated: true,
					},
				},
			};

			const userData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(userData);

			const foundUser = await userModel.findOne({ ldapDn: ldapUserDn }).lean().exec();
			expect(foundUser).to.be.not.null;
			expect(foundUser.email).to.be.equal(updatedEmail);
			expect(foundUser.firstName).to.be.equal(updatedFirstName);
			expect(foundUser.lastName).to.be.equal(updatedLastName);
		});

		it('should not create user if the school is in maintenance mode', async () => {
			const oneDayinMilliseconds = 24 * 60 * 60 * 1000;
			const inMaintenanceSince = Date.now() - oneDayinMilliseconds;
			const school = await testObjects.createTestSchool({
				ldapSchoolIdentifier: ldapSchoolIDn,
				systems: [system._id],
				inMaintenanceSince,
			});

			const contentData = {
				action: 'syncUser',
				syncId: '6082d22395baca4f64ef0a1f',
				data: {
					user: {
						firstName: 'test first',
						lastName: 'test last',
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						email: `test${Date.now()}@example.com`,
						ldapDn: ldapUserDn,
						ldapId: 'LDAP_USER_ID',
						roles: ['student'],
					},
					account: {
						ldapDn: ldapUserDn,
						ldapId: 'LDAP_USER_ID',
						username: accountUserName,
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						activated: true,
					},
				},
			};

			const userData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(userData);

			const foundUser = await userModel.findOne({ ldapDn: ldapUserDn }).lean().exec();
			expect(foundUser).to.be.null;
		});
	});

	describe('class messages', () => {
		beforeEach(async () => {
			system = await testObjects.createTestSystem();
		});

		it('should create class by the data', async () => {
			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
			const className = 'test class';

			const contentData = {
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				syncId: '6082c4f2ba4aef3c5c4473fd',
				data: {
					class: {
						name: className,
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						nameFormat: 'static',
						ldapDN: ldapClassDn,
					},
				},
			};
			const classData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(classData);

			const foundClass = await classModel.findOne({ ldapDN: ldapClassDn }).lean().exec();
			expect(foundClass).to.be.not.null;
			expect(foundClass.name).to.be.equal(className);
			expect(foundClass.userIds).to.be.empty;
			expect(foundClass.teacherIds).to.be.empty;
		});

		it('should update existing class by the data', async () => {
			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
			const initialClassName = 'initial test class';

			await testObjects.createTestClass({
				name: initialClassName,
				ldapDN: ldapClassDn,
				schoolId: school._id,
				year: school.currentYear,
			});

			const updatedClassName = 'updated test class';
			const contentData = {
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				syncId: '6082c4f2ba4aef3c5c4473fd',
				data: {
					class: {
						name: updatedClassName,
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						nameFormat: 'static',
						ldapDN: ldapClassDn,
						uniqueMembers: ['some uuid'],
					},
				},
				uniqueMembers: [null],
			};
			const classData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(classData);

			const foundClass = await classModel.findOne({ ldapDN: ldapClassDn }).lean().exec();
			expect(foundClass).to.be.not.null;
			expect(foundClass.name).to.be.equal(updatedClassName);
		});

		it('should create class with users by the data', async () => {
			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
			const className = 'test class';
			const ldapDns = ['user1', 'user2'];
			const contentData = {
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				syncId: '6082c4f2ba4aef3c5c4473fd',
				data: {
					class: {
						name: className,
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						nameFormat: 'static',
						ldapDN: ldapClassDn,
						uniqueMembers: ldapDns,
					},
				},
				uniqueMembers: [null],
			};
			const classData = {
				content: JSON.stringify(contentData),
			};
			const testStudent = await testObjects.createTestUser({
				ldapDn: ldapDns[0],
				schoolId: school._id,
				roles: ['student'],
			});
			const testTeacher = await testObjects.createTestUser({
				ldapDn: ldapDns[1],
				schoolId: school._id,
				roles: ['teacher'],
			});

			await ldapConsumer.executeMessage(classData);

			const foundClass = await classModel.findOne({ ldapDN: ldapClassDn }).lean().exec();
			expect(foundClass).to.be.not.null;
			expect(foundClass.name).to.be.equal(className);

			expect(foundClass.userIds.length).to.be.equal(1);
			expect(foundClass.teacherIds.length).to.be.equal(1);

			expect(foundClass.userIds.map((userId) => userId.toString())).to.include(testStudent._id.toString());
			expect(foundClass.teacherIds.map((userId) => userId.toString())).to.include(testTeacher._id.toString());
		});

		it('should throw SyncError if school could not be found', async () => {
			const className = 'test class';
			const schoolDn = 'Not existed school dn';
			const contentData = {
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				syncId: '6082c4f2ba4aef3c5c4473fd',
				data: {
					class: {
						name: className,
						systemId: system._id.toString(),
						schoolDn,
						nameFormat: 'static',
						ldapDN: ldapClassDn,
						uniqueMembers: ['some uuid'],
					},
				},
				uniqueMembers: [null],
			};
			const classData = {
				content: JSON.stringify(contentData),
			};
			await expect(ldapConsumer.executeMessage(classData)).to.be.rejectedWith(SyncError);
		});

		it('should not create class when school is in maintenance mode', async () => {
			const oneDayinMilliseconds = 24 * 60 * 60 * 1000;
			const inMaintenanceSince = Date.now() - oneDayinMilliseconds;
			const school = await testObjects.createTestSchool({
				ldapSchoolIdentifier: ldapSchoolIDn,
				systems: [system._id],
				inMaintenanceSince,
			});

			const contentData = {
				action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
				syncId: '6082c4f2ba4aef3c5c4473fd',
				data: {
					class: {
						name: 'test class',
						systemId: system._id.toString(),
						schoolDn: school.ldapSchoolIdentifier,
						nameFormat: 'static',
						ldapDN: ldapClassDn,
					},
				},
			};
			const classData = {
				content: JSON.stringify(contentData),
			};
			await ldapConsumer.executeMessage(classData);

			const foundClass = await classModel.findOne({ ldapDN: ldapClassDn }).lean().exec();
			expect(foundClass).to.be.null;
		});
	});
});
