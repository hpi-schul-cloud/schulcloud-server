const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { Configuration } = require('@hpi-schul-cloud/commons');

const SchoolYearFacade = require('../../../src/services/school/logic/year');

const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const { SchoolRepo, UserRepo, ClassRepo } = require('../../../src/services/sync/repo');

const { userModel } = require('../../../src/services/user/model');

const { classModel } = require('../../../src/services/user-group/model');
const { schoolModel } = require('../../../src/services/school/model');

const testObjects = require('../helpers/testObjects')(appPromise());
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

	async get() {
		return { school: 'some school' };
	}

	getSchools() {
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

const createTestSchools = async (system) =>
	Promise.all(
		exampleLdapSchoolData.map((school) =>
			testObjects.createTestSchool({
				ldapSchoolIdentifier: school.ldapOu,
				name: school.displayName,
				systems: [system._id],
			})
		)
	);

const createTestUsers = async (schools) =>
	Promise.all(
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

// the call should be with function, otherwise 'this' will not be available
// this is not executed on the CI since RabbitMQ is not available
xdescribe('Ldap Sync Integration', () => {
	let configBefore;
	let app;
	let nestServices;
	let accountService;
	let server;
	let system;

	const cleanupAll = async () => {
		await testObjects.cleanup();
		const accounts = exampleLdapUserData.map((user) => `${user.schoolDn}/${user.ldapUID}`.toLowerCase());

		for (const accountUserName of accounts) {
			// eslint-disable-next-line no-await-in-loop
			const [accountResult] = await accountService.searchByUsernameExactMatch(accountUserName);
			if (accountResult.length) {
				// eslint-disable-next-line no-await-in-loop
				await accountService.delete(accountResult[0].id);
			}
		}
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
		configBefore = Configuration.toObject({ plainSecrets: true });
		app = await appPromise();
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
		accountService = await app.service('nest-account-service');
		await cleanupAll();
	});

	beforeEach(async () => {
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
		Configuration.reset(configBefore);
		await server.close();
		await closeNestServices(nestServices);
	});

	async function executeLdapSync(testFuncContext, options) {
		const params = { query: { target: 'ldap' } };
		app.services.ldap = new FakeLdapService(app, options);
		try {
			const result = await app.service('sync').find(params);
			// eslint-disable-next-line promise/param-names
			await new Promise((r) => setTimeout(r, 1000));
			expect(result.length).to.be.eql(1);
			expect(result[0].success).to.be.true;
		} catch (e) {
			syncLogger.error(e);
		}
	}

	it('should create schools from ldap sync', async function test() {
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

	it('should create users from ldap sync', async function test() {
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

	it('should create classes from ldap sync', async function test() {
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
			expect(actualStudentIds).to.have.members(expectedStudentIds);

			const actualTeacherIds = foundClass.teacherIds.map((id) => id.toString());
			expect(actualTeacherIds.length).to.be.eql(exampleLdapTeachers.length);
			expect(actualTeacherIds).to.have.members(expectedTeacherIds);
		}
	});
}).timeout(20000);
