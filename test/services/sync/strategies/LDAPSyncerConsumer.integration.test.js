const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const { LDAP_SYNC_ACTIONS } = require('../../../../src/services/sync/strategies/LDAPSyncer');
const { LDAPSyncerConsumer } = require('../../../../src/services/sync/strategies/LDAPSyncerConsumer');

const { userModel } = require('../../../../src/services/user/model');
const accountModel = require('../../../../src/services/account/model');

const { classModel } = require('../../../../src/services/user-group/model');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');

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

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
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
		const contentData = {
			action: 'syncSchool',
			syncId: '6082d04c4f92b7557025df7b',
			data: {
				name: schoolName,
				systems: [system._id],
				ldapSchoolIdentifier: ldapSchoolIDn,
			},
		};
		const schoolData = {
			content: JSON.stringify(contentData),
		};

		const ldapConsumer = new LDAPSyncerConsumer();
		const result = await ldapConsumer.executeMessage(schoolData);
		expect(result).to.be.equal(true);

		const foundSchool = await schoolModel.findOne({ ldapSchoolIdentifier: ldapSchoolIDn }).lean().exec();
		expect(foundSchool).to.be.not.null;
		expect(foundSchool.name).to.be.equal(schoolName);
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
		const ldapConsumer = new LDAPSyncerConsumer();
		const result = await ldapConsumer.executeMessage(userData);

		expect(result).to.be.equal(true);

		const foundUser = await userModel.findOne({ ldapDn: ldapUserDn }).lean().exec();
		expect(foundUser).to.be.not.null;
		expect(foundUser.email).to.be.equal(testEmail);
		expect(foundUser.firstName).to.be.equal(firstName);
		expect(foundUser.lastName).to.be.equal(lastName);

		const foundAccount = await accountModel.findOne({ userId: foundUser._id }).lean().exec();
		expect(foundAccount).to.be.not.null;
		expect(foundAccount.username).to.be.equal(accountUserName.toLowerCase());
	});

	it('should create class by the data', async () => {
		const className = 'test class';
		const system = await testObjects.createTestSystem();
		const school = await testObjects.createTestSchool({ ldapSchoolIdentifier: ldapSchoolIDn, systems: [system._id] });
		const contentData = {
			action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
			syncId: '6082c4f2ba4aef3c5c4473fd',
			data: {
				name: className,
				systemId: system._id.toString(),
				schoolDn: school.ldapSchoolIdentifier,
				nameFormat: 'static',
				ldapDN: ldapClassDn,
				uniqueMembers: ['some uuid'],
			},
			uniqueMembers: [null],
		};
		const classData = {
			content: JSON.stringify(contentData),
		};
		const ldapConsumer = new LDAPSyncerConsumer();
		const result = await ldapConsumer.executeMessage(classData);
		expect(result).to.be.equal(true);

		const foundClass = await classModel.findOne({ ldapDN: ldapClassDn }).lean().exec();
		expect(foundClass).to.be.not.null;
		expect(foundClass.name).to.be.equal(className);
	});
});
