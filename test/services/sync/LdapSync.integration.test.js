const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const SchoolYearFacade = require('../../../src/services/school/logic/year');

const appPromise = require('../../../src/app');
const { SchoolRepo, UserRepo, ClassRepo } = require('../../../src/services/sync/repo');

const { userModel } = require('../../../src/services/user/model');
const accountModel = require('../../../src/services/account/model');

const { classModel } = require('../../../src/services/user-group/model');
const { schoolModel } = require('../../../src/services/school/model');

const testObjects = require('../helpers/testObjects')(appPromise);

const { expect } = chai;
chai.use(chaiAsPromised);

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

const exampleLdapUserData = [
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
		firstName: 'firstName2',
		lastName: 'lastName2',
		email: 'test2@example.com',
		ldapDn: 'ldapDn2',
		ldapUID: 'ldapUID2',
		ldapUUID: 'ldapUUID2',
		roles: ['teacher'],
		schoolDn: exampleLdapSchoolData[1].ldapOu,
	},
];

const exampleLdapClassData = [
	{
		name: 'exampleClass',
		ldapDN: 'ldapDn',
		uniqueMembers: exampleLdapUserData.map((u) => u.ldapDn),
		schoolDn: exampleLdapSchoolData[0].ldapOu,
	},
];

class FakeLdapService {
	constructor(app) {
		this.app = app;
	}

	async get(id, params) {
		return { school: 'some school' };
	}

	getSchools(ldapConfig) {
		return exampleLdapSchoolData;
	}

	getClasses(ldapConfig, school) {
		return exampleLdapClassData.filter((exampleClass) => exampleClass.schoolDn === school.ldapSchoolIdentifier);
	}

	getUsers(ldapConfig, school) {
		return exampleLdapUserData.filter((exampleUser) => exampleUser.schoolDn === school.ldapSchoolIdentifier);
	}

	async disconnect() {
		return true;
	}
}

describe.only('Ldap Sync Integration', function () {
	this.timeout(20000);
	let app;
	let server;
	let system;

	const cleanupAll = async () => {
		await testObjects.cleanup();
		const accounts = exampleLdapUserData.map((user) => `${user.schoolDn}/${user.ldapUID}`.toLowerCase());
		const deleteAccountRes = await accountModel
			.deleteMany({ username: { $in: accounts } })
			.lean()
			.exec();
		const userLdapDns = exampleLdapUserData.map((user) => user.ldapDn);
		const deleteUserRes = await userModel
			.deleteMany({ ldapDn: { $in: userLdapDns } })
			.lean()
			.exec();
		const classLdapDns = exampleLdapClassData.map((clazz) => clazz.ldapDN);
		const deleteClassRes = await classModel
			.deleteMany({ ldapDN: { $in: classLdapDns } })
			.lean()
			.exec();

		const schoolLdapDns = exampleLdapSchoolData.map((school) => school.ldapOu);
		const deleteSchoolRes = await schoolModel
			.deleteMany({ ldapSchoolIdentifier: { $in: schoolLdapDns } })
			.lean()
			.exec();
	};

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
		await cleanupAll();
		app.services.ldap = new FakeLdapService(app);
		system = await testObjects.createTestSystem({
			type: 'ldap',
			ldapConfig: fakeLdapConfig,
		});
	});

	afterEach(async () => {
		await cleanupAll();
	});

	after(async () => {
		await server.close();
	});

	it('should run the whole sync process', async () => {
		const params = { query: { target: 'ldap' } };
		const result = await app.service('sync').find(params);
		expect(result.length).to.be.eql(1);
		expect(result[0].success).to.be.true;
		// eslint-disable-next-line promise/param-names
		await new Promise((r) => setTimeout(r, 5000));
		const foundSchools = await Promise.all(
			exampleLdapSchoolData.map((exampleSchool) =>
				SchoolRepo.findSchoolByLdapIdAndSystem(exampleSchool.ldapOu, system._id)
			)
		);
		expect(foundSchools.length).to.be.eql(exampleLdapSchoolData.length);
		foundSchools.forEach((foundSchool) => expect(foundSchool).to.be.not.null);
		const currentYear = new SchoolYearFacade(await SchoolRepo.getYears()).defaultYear;

		const foundClasses = await Promise.all(
			exampleLdapClassData.map((exampleClass) =>
				ClassRepo.findClassByYearAndLdapDn(currentYear._id, exampleClass.ldapDN)
			)
		);
		expect(foundClasses.length).to.be.eql(exampleLdapClassData.length);
		foundClasses.forEach((foundClass) => expect(foundClass).to.be.not.null);

		const foundUsers = await Promise.all(
			exampleLdapUserData.map((exampleUser) =>
				UserRepo.findByLdapIdAndSchool(exampleUser.ldapUUID, foundSchools[0]._id)
			)
		);
		expect(foundUsers.length).to.be.eql(exampleLdapUserData.length);
		foundUsers.forEach((foundUser) => expect(foundUser).to.be.not.null);
	});
});
