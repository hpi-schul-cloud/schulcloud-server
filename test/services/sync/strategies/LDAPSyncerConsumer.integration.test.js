const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/LDAPSyncer');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');
const { SchoolAction, UserAction, ClassAction } = require('../../../../src/services/sync/strategies/consumerActions');
const SchoolYearFacade = require('../../../../src/services/school/logic/year');

const { userModel } = require('../../../../src/services/user/model');
const accountModel = require('../../../../src/services/account/model');

const { classModel } = require('../../../../src/services/user-group/model');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');
const { SyncError } = require('../../../../src/errors/applicationErrors');

const testObjects = require('../../helpers/testObjects')(appPromise);

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

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		const shouldUseFilter = true;
		ldapConsumer = new LDAPSyncerConsumer(
			new SchoolAction(shouldUseFilter),
			new UserAction(shouldUseFilter),
			new ClassAction(shouldUseFilter)
		);
	});

	afterEach(async () => {
		await accountModel.deleteOne({ username: accountUserName.toLowerCase() }).lean().exec();
		await userModel.deleteOne({ ldapDn: ldapUserDn }).lean().exec();
		await classModel.deleteOne({ ldapDN: ldapClassDn }).lean().exec();

		await schoolModel.deleteOne({ ldapSchoolIdentifier: ldapSchoolIDn }).lean().exec();
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});

	it('should create school by the data', async () => {
		const schoolName = 'test school';
		const system = await testObjects.createTestSystem();
		const years = await app.service('years').find({ query: { name: '2021/22' } });
		const currentYear = new SchoolYearFacade(years.data).defaultYear;
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
		expect(foundSchool.currentYear.toString()).to.be.equal(currentYear._id.toString());
	});

	it('should update existing school by the data', async () => {
		const initialSchoolName = 'Initial School Name';
		const system = await testObjects.createTestSystem();
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

	it('should create user by the data', async () => {
		const testEmail = `test${Date.now()}@example.com`;
		const firstName = 'test first';
		const lastName = 'test last';
		const ldapUserId = 'LDAP_USER_ID';

		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });

		const contentData = {
			action: 'syncUser',
			syncId: '6082d22395baca4f64ef0a1f',
			data: {
				user: {
					firstName,
					lastName,
					systemId: system._id.toString(),
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
		expect(foundUser).to.be.not.null;
		expect(foundUser.email).to.be.equal(testEmail);
		expect(foundUser.firstName).to.be.equal(firstName);
		expect(foundUser.lastName).to.be.equal(lastName);

		const foundAccount = await accountModel.findOne({ userId: foundUser._id }).lean().exec();
		expect(foundAccount).to.be.not.null;
		expect(foundAccount.username).to.be.equal(accountUserName.toLowerCase());
	});

	it('should update existing user by the data', async () => {
		const initialFirstName = 'initial fname';
		const initialLastName = 'initial lname';
		const initialEmail = `initial_test${Date.now()}@example.com`;
		const updatedEmail = `test${Date.now()}@example.com`;
		const updatedFirstName = 'test first';
		const updatedLastName = 'test last';
		const ldapUserId = 'LDAP_USER_ID';

		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
		await testObjects.createTestUser({
			ldapId: ldapUserId,
			firstName: initialFirstName,
			lastName: initialLastName,
			email: initialEmail,
			schoolId: school._id,
		});
		const contentData = {
			action: 'syncUser',
			syncId: '6082d22395baca4f64ef0a1f',
			data: {
				user: {
					firstName: updatedFirstName,
					lastName: updatedLastName,
					systemId: system._id.toString(),
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
		expect(foundUser).to.be.not.null;
		expect(foundUser.email).to.be.equal(updatedEmail);
		expect(foundUser.firstName).to.be.equal(updatedFirstName);
		expect(foundUser.lastName).to.be.equal(updatedLastName);
	});

	it('should create class by the data', async () => {
		const className = 'test class';
		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
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
		expect(foundClass.name).to.be.equal(className);
	});

	it('should update existing class by the data', async () => {
		const initialClassName = 'initial test class';

		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });

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

	it('should throw SyncError if school could not be found', async () => {
		const className = 'test class';
		const system = await testObjects.createTestSystem();
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
		expect(ldapConsumer.executeMessage(classData)).to.be.rejectedWith(SyncError);
	});
});
