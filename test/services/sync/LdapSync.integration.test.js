const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Configuration } = require('@hpi-schul-cloud/commons');

const SchoolYearFacade = require('../../../src/services/school/logic/year');

const appPromise = require('../../../src/app');
const { SchoolRepo, UserRepo, ClassRepo } = require('../../../src/services/sync/repo');

const { userModel } = require('../../../src/services/user/model');
const accountModel = require('../../../src/services/account/model');

const { classModel } = require('../../../src/services/user-group/model');
const { schoolModel } = require('../../../src/services/school/model');

const testObjects = require('../helpers/testObjects')(appPromise);
const { syncLogger } = require('../../../src/logger/syncLogger');

const { expect } = chai;
chai.use(chaiAsPromised);

const SYSTEM_ALIAS = 'test_ldap';
const fakeLdapConfig = {
	active: true,
};

const exampleLdapSchoolData = [
	{
		displayName: 'school1',
		ldapOu: testObjects.generateObjectId().toString(),
	},
	{
		displayName: 'school2',
		ldapOu: testObjects.generateObjectId().toString(),
	},
	{
		displayName: 'school2',
		ldapOu: testObjects.generateObjectId().toString(),
	},
];

const exampleLdapStudents = [
	{
		firstName: 'firstName1',
		lastName: 'lastName1',
		email: `test1@example.com`,
		ldapDn: 'ldapDn1',
		ldapUID: 'ldapUID1',
		ldapUUID: 'ldapUUID1',
		roles: ['student'],
		schoolDn: exampleLdapSchoolData[0].ldapOu,
	},
	{
		firstName: 'firstName1',
		lastName: 'lastName1',
		email: `test12@example.com`,
		ldapDn: 'ldapDn12',
		ldapUID: 'ldapUID12',
		ldapUUID: 'ldapUUID12',
		roles: ['student'],
		schoolDn: exampleLdapSchoolData[0].ldapOu,
	},
];

const exampleLdapTeachers = [
	{
		firstName: 'firstName2',
		lastName: 'lastName2',
		email: 'test2@example.com',
		ldapDn: 'ldapDn2',
		ldapUID: 'ldapUID2',
		ldapUUID: 'ldapUUID2',
		roles: ['teacher'],
		schoolDn: exampleLdapSchoolData[0].ldapOu,
	},
];

const exampleLdapUserData = [...exampleLdapStudents, ...exampleLdapTeachers];

const exampleLdapClassData = [
	{
		name: 'exampleClass',
		ldapDn: 'ldapDn',
		uniqueMembers: exampleLdapUserData.map((u) => u.ldapDn),
		schoolDn: exampleLdapSchoolData[0].ldapOu,
	},
];

class FakeLdapService {
	constructor(app, options) {
		this.app = app;
		this.options = options;
	}

	async get(id, params) {
		return { school: 'some school' };
	}

	getSchools(ldapConfig) {
		return this.options.fillSchools ? exampleLdapSchoolData : [];
	}

	getClasses(ldapConfig, school) {
		return this.options.fillClasses
			? exampleLdapClassData.filter((exampleClass) => exampleClass.schoolDn === school.ldapSchoolIdentifier)
			: [];
	}

	getUsers(ldapConfig, school) {
		return this.options.fillUsers
			? exampleLdapUserData.filter((exampleUser) => exampleUser.schoolDn === school.ldapSchoolIdentifier)
			: [];
	}

	async disconnect() {
		return true;
	}
}

const createTestSchools = async (system) => {
	return Promise.all(
		exampleLdapSchoolData.map((school) =>
			testObjects.createTestSchool({
				ldapSchoolIdentifier: school.ldapOu,
				name: school.displayName,
				systems: [system._id],
			})
		)
	);
};

const createTestUsers = async (schools) => {
	return Promise.all(
		exampleLdapUserData.map((user) =>
			testObjects.createTestUser({
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				ldapDn: user.ldapDn,
				ldapId: user.ldapUUID,
				roles: user.roles,
				schoolId: schools.filter((school) => school.ldapSchoolIdentifier === user.schoolDn)[0]._id,
			})
		)
	);
};

const isRabbitMqAvailable = (result) => {
	const isRabbitMqEnabled = Configuration.get('FEATURE_RABBITMQ_ENABLED') === true;
	if (!isRabbitMqEnabled) {
		return false;
	}
	const isSuccess = result[0].success;
	if (!isSuccess) {
		const systemErrors = result[0].systems[SYSTEM_ALIAS].errors;
		return !systemErrors || systemErrors[0].code !== 'ECONNREFUSED';
	}
	return true;
};

// the call should be with function, otherwise 'this' will not be available
describe('Ldap Sync Integration', function () {
	this.timeout(20000);
	let app;
	let server;
	let system;

	const cleanupAll = async () => {
		await testObjects.cleanup();
		const accounts = exampleLdapUserData.map((user) => `${user.schoolDn}/${user.ldapUID}`.toLowerCase());
		await accountModel
			.deleteMany({ username: { $in: accounts } })
			.lean()
			.exec();
		const userLdapDns = exampleLdapUserData.map((user) => user.ldapDn);
		await userModel
			.deleteMany({ ldapDn: { $in: userLdapDns } })
			.lean()
			.exec();
		const classLdapDns = exampleLdapClassData.map((clazz) => clazz.ldapDN);
		await classModel
			.deleteMany({ ldapDN: { $in: classLdapDns } })
			.lean()
			.exec();
		const schoolLdapDns = exampleLdapSchoolData.map((school) => school.ldapOu);
		await schoolModel
			.deleteMany({ ldapSchoolIdentifier: { $in: schoolLdapDns } })
			.lean()
			.exec();
	};

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		await cleanupAll();
	});

	beforeEach(async function beforeEach() {
		system = await testObjects.createTestSystem({
			type: 'ldap',
			ldapConfig: fakeLdapConfig,
			alias: SYSTEM_ALIAS,
		});
	});

	afterEach(async () => {
		await cleanupAll();
	});

	after(async () => {
		await server.close();
	});

	async function executeLdapSync(testFuncContext, options) {
		const params = { query: { target: 'ldap' } };
		app.services.ldap = new FakeLdapService(app, options);
		try {
			const result = await app.service('sync').find(params);
			if (!isRabbitMqAvailable(result)) {
				testFuncContext.skip();
			}
			// eslint-disable-next-line promise/param-names
			await new Promise((r) => setTimeout(r, 1000));
			expect(result.length).to.be.eql(1);
			expect(result[0].success).to.be.true;
		} catch (e) {
			syncLogger.error(e);
		}
	}

	it('should create schools from ldap sync', async function () {
		const options = {
			fillSchools: true,
		};
		await executeLdapSync(this, options);

		const foundSchools = await Promise.all(
			exampleLdapSchoolData.map((exampleSchool) =>
				SchoolRepo.findSchoolByLdapIdAndSystem(exampleSchool.ldapOu, system._id)
			)
		);
		expect(foundSchools.length).to.be.eql(exampleLdapSchoolData.length);
		foundSchools.forEach((foundSchool) => expect(foundSchool).to.be.not.null);
	});

	it('should create users from ldap sync', async function () {
		const schools = await createTestSchools(system);

		const options = {
			fillSchools: true,
			fillUsers: true,
		};
		await executeLdapSync(this, options);

		const foundUsers = await Promise.all(
			exampleLdapUserData.map((exampleUser) => {
				const foundSchool = schools.filter((school) => school.ldapSchoolIdentifier === exampleUser.schoolDn);
				return UserRepo.findByLdapIdAndSchool(exampleUser.ldapUUID, foundSchool[0]._id);
			})
		);
		expect(foundUsers.length).to.be.eql(exampleLdapUserData.length);
		foundUsers.forEach((foundUser) => expect(foundUser).to.be.not.null);
	});

	const getExpectedStudentIdsForClass = (exampleClass, users) => {
		const expectedStudentLdapDns = exampleLdapStudents
			.filter((exampleUser) => exampleClass.uniqueMembers.includes(exampleUser.ldapDn))
			.map((u) => u.ldapDn);
		return users.filter((user) => expectedStudentLdapDns.includes(user.ldapDn)).map((user) => user._id.toString());
	};

	const getExpectedTeacherIdsForClass = (exampleClass, users) => {
		const expectedTeachersLdapDns = exampleLdapTeachers
			.filter((exampleUser) => exampleClass.uniqueMembers.includes(exampleUser.ldapDn))
			.map((u) => u.ldapDn);
		return users.filter((user) => expectedTeachersLdapDns.includes(user.ldapDn)).map((user) => user._id.toString());
	};

	it('should create classes from ldap sync', async function () {
		const schools = await createTestSchools(system);
		const users = await createTestUsers(schools);
		const options = {
			fillSchools: true,
			fillClasses: true,
		};
		await executeLdapSync(this, options);

		const currentYear = new SchoolYearFacade(await SchoolRepo.getYears()).defaultYear;

		const foundClasses = await Promise.all(
			exampleLdapClassData.map((exampleClass) =>
				ClassRepo.findClassByYearAndLdapDn(currentYear._id, exampleClass.ldapDn)
			)
		);
		expect(foundClasses.length).to.be.eql(exampleLdapClassData.length);

		for (const foundClass of foundClasses) {
			expect(foundClass).to.be.not.null;
			const exampleClass = exampleLdapClassData.filter((ex) => foundClass.ldapDN === ex.ldapDn)[0];
			const expectedStudentIds = getExpectedStudentIdsForClass(exampleClass, users);
			const expectedTeacherIds = getExpectedTeacherIdsForClass(exampleClass, users);

			const actualStudentIds = foundClass.userIds.map((id) => id.toString());
			expect(actualStudentIds.length).to.be.eql(exampleLdapStudents.length);
			expect(actualStudentIds).to.be.eql(expectedStudentIds);

			const actualTeacherIds = foundClass.teacherIds.map((id) => id.toString());
			expect(actualTeacherIds.length).to.be.eql(exampleLdapTeachers.length);
			expect(actualTeacherIds).to.be.eql(expectedTeacherIds);
		}
	});
});
