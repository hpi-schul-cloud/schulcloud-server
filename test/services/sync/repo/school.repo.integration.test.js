const chai = require('chai');
const { ObjectId } = require('mongoose').Types;
const chaiAsPromised = require('chai-as-promised');
const SchoolRepo = require('../../../../src/services/sync/repo/school.repo');
const { schoolModel } = require('../../../../src/services/school/model');

const appPromise = require('../../../../src/app');

const testObjects = require('../../helpers/testObjects')(appPromise);

chai.use(chaiAsPromised);
const { expect } = chai;

describe('school repo', () => {
	let app;
	let server;
	const createdSchools = [];

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	beforeEach(async () => {});

	afterEach(async () => {
		const promises = createdSchools.map((school) => schoolModel.remove(school));
		await Promise.all(promises);
		await testObjects.cleanup();
	});

	after(async () => {
		await server.close();
	});
	describe('createSchool', () => {
		it('should successfully create new school', async () => {
			const schoolName = 'Test School';
			const currentYear = new ObjectId();
			const federalStateId = new ObjectId();
			const systemId = new ObjectId();
			const ldapSchoolIDn = 'TEST_LDAP';
			const fileStorageType = 'awsS3';
			const school = {
				name: schoolName,
				systems: [systemId],
				ldapSchoolIdentifier: ldapSchoolIDn,
				currentYear,
				federalState: federalStateId,
				fileStorageType,
			};
			const res = await SchoolRepo.createSchool(school);
			createdSchools.push(res);
			expect(res._id).to.be.not.undefined;
			expect(res.name).to.be.equal(schoolName);
			expect(res.ldapSchoolIdentifier).to.be.equal(ldapSchoolIDn);
			expect(res.systems[0]._id.toString()).to.be.equal(systemId.toString());
			expect(res.federalState.toString()).to.be.equal(federalStateId.toString());
			expect(res.currentYear.toString()).to.be.equal(currentYear.toString());
			expect(res.fileStorageType).to.be.equal(fileStorageType);
		});
	});

	describe('updateSchoolName', () => {
		it('should successfully update school name', async () => {
			const schoolName = 'New Test School';
			const school = await testObjects.createTestSchool({});
			const res = await SchoolRepo.updateSchoolName(school._id, schoolName);
			expect(res.name).to.be.equal(schoolName);
		});
	});

	describe('findSchoolByLdapIdAndSystem', () => {
		it('should return null if not found', async () => {
			const res = await SchoolRepo.findSchoolByLdapIdAndSystem('not existed dn', undefined);
			expect(res).to.be.null;
		});

		it('should find school by ldap and system', async () => {
			const ldapSchoolIdentifier = 'LDAP_ID';
			const system = await testObjects.createTestSystem();
			const school = await testObjects.createTestSchool({ ldapSchoolIdentifier, systems: [system._id] });
			const res = await SchoolRepo.findSchoolByLdapIdAndSystem(ldapSchoolIdentifier, system._id);
			expect(res._id.toString()).to.be.equal(school._id.toString());
		});
	});

	describe('getYears', () => {
		it('should return all years from 2017/18 till 2024/25', async () => {
			const res = await SchoolRepo.getYears();
			for (let yearNr = 17; yearNr <= 24; yearNr += 1) {
				const yearName = `20${yearNr}/${yearNr + 1}`;
				expect(res.some((year) => year.name === yearName)).to.be.true;
			}
		});
	});

	describe('findFederalState', () => {
		it('should find federal state by abbreviation', async () => {
			const res = await SchoolRepo.findFederalState('BE');
			expect(res.name).to.be.equal('Berlin');
		});
	});
});
