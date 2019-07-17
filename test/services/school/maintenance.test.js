const { expect } = require('chai');
const app = require('./../../../src/app');
const { cleanup } = require('../helpers/testObjects')(app);
const { create: createSchool } = require('./../helpers/services/schools')(app);
const { create: createSystem } = require('./../helpers/services/testSystem')(app);

const { schoolUsesLdap } = require('./../../../src/services/school/maintenance');

describe('schoolUsesLdap', () => {
	it('should return false for normal schools', async () => {
		const school = await createSchool();
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	it('should return false for inactive ldap systems', async () => {
		const school = await createSchool({
			systems: [
				await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: false,
					},
				}),
			],
		});
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(false);
	});

	it('should return true for active ldap systems', async () => {
		const school = await createSchool({
			systems: [
				await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				}),
			],
		});
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);
	});

	it('should work even if multiple systems are registered', async () => {
		const school = await createSchool({
			systems: [
				await createSystem({
					type: 'local',
				}),
				await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				}),
				await createSystem({
					type: 'moodle',
					url: 'https://schul-cloud.org/moodle',
				}),
			],
		});
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);

		const school2 = await createSchool({
			systems: [
				await createSystem({
					type: 'local',
				}),
				await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: false,
					},
				}),
				await createSystem({
					type: 'moodle',
					url: 'https://schul-cloud.org/moodle',
				}),
			],
		});
		expect(() => schoolUsesLdap(school2)).not.to.throw();
		expect(schoolUsesLdap(school2)).to.equal(false);
	});

	it('should work if multiple ldap systems are in use', async () => {
		const school = await createSchool({
			systems: [
				await createSystem({
					type: 'ldap',
					ldapConfig: { active: false },
				}),
				await createSystem({
					type: 'ldap',
					ldapConfig: { active: true },
				}),
			],
		});
		expect(() => schoolUsesLdap(school)).not.to.throw();
		expect(schoolUsesLdap(school)).to.equal(true);
	});

	afterEach(cleanup);
});
