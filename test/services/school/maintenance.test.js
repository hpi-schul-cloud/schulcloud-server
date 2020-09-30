const { expect } = require('chai');
const appPromise = require('../../../src/app');
const { cleanup } = require('../helpers/testObjects')(appPromise);
const { create: createSchool } = require('../helpers/services/schools')(appPromise);
const { create: createSystem } = require('../helpers/services/testSystem')(appPromise);

const { schoolUsesLdap } = require('../../../src/services/school/maintenance');

describe('schoolUsesLdap', () => {
	let app;
	let server;

	before(async () => {
		app = await appPromise;
		server = await app.listen(0);
	});

	after(async () => {
		await server.close();
	});

	it('should return false for normal schools', async () => {
		const school = await createSchool();
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	it('should return false for inactive ldap systems', async () => {
		const school = await createSchool();
		school.systems = [
			await createSystem({
				type: 'ldap',
				ldapConfig: {
					active: false,
				},
			}),
		];
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	it('should return true for active ldap systems', async () => {
		const school = await createSchool();
		school.systems = [
			await createSystem({
				type: 'ldap',
				ldapConfig: {
					active: true,
				},
			}),
		];
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);
	});

	it('should work even if multiple systems are registered', async () => {
		const school = await createSchool();
		school.systems = await Promise.all([
			createSystem({
				type: 'local',
			}),
			createSystem({
				type: 'ldap',
				ldapConfig: {
					active: true,
				},
			}),
			createSystem({
				type: 'moodle',
				url: 'https://schul-cloud.org/moodle',
			}),
		]);
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);

		const school2 = await createSchool();
		school2.systems = await Promise.all([
			createSystem({
				type: 'local',
			}),
			createSystem({
				type: 'ldap',
				ldapConfig: {
					active: false,
				},
			}),
			createSystem({
				type: 'moodle',
				url: 'https://schul-cloud.org/moodle',
			}),
		]);
		expect(() => schoolUsesLdap(school2)).not.to.throw();
		expect(schoolUsesLdap(school2)).to.equal(false);
	});

	it('should work if multiple ldap systems are in use', async () => {
		const school = await createSchool();
		school.systems = await Promise.all([
			createSystem({
				type: 'ldap',
				ldapConfig: { active: false },
			}),
			createSystem({
				type: 'ldap',
				ldapConfig: { active: true },
			}),
		]);
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);
	});

	it('should work if no systems are registered', async () => {
		const school = await createSchool({
			systems: [],
		});
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	it('should work if systems are undefined', async () => {
		const school = await createSchool();
		delete school.systems;
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	afterEach(cleanup);
});
