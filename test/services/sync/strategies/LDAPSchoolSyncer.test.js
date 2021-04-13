const { expect } = require('chai');

const LDAPSchoolSyncer = require('../../../../src/services/sync/strategies/LDAPSchoolSyncer');

const appPromise = require('../../../../src/app');

describe('Ldap School Syncer', () => {
	let app;

	before(async () => {
		app = await appPromise;
	});

	it('default initializer', () => {
		const stats = {};
		const schoolName = 'Test School';
		const school = { name: schoolName };
		const system = { ldapConfig: {} };
		const options = {};

		const ldapSchoolSyncer = new LDAPSchoolSyncer(app, stats, {}, system, school, options);
		expect(ldapSchoolSyncer.syncId).to.be.not.undefined;
		expect(ldapSchoolSyncer.stats.errors.length).to.be.equal(0);
		expect(ldapSchoolSyncer.stats.name).to.be.equal(schoolName);
		expect(ldapSchoolSyncer.stats.users.created).to.be.equal(0);
		expect(ldapSchoolSyncer.stats.users.updated).to.be.equal(0);
		expect(ldapSchoolSyncer.stats.classes.created).to.be.equal(0);
		expect(ldapSchoolSyncer.stats.classes.updated).to.be.equal(0);
		expect(ldapSchoolSyncer.stats.startTimestamp).to.be.not.undefined;
		expect(ldapSchoolSyncer.stats.modifyTimestamp).to.be.equal('0');
	});

	it('initialize with forceFullSync', () => {
		const stats = {};
		const schoolName = 'Test School';
		const school = { name: schoolName, ldapLastSync: new Date() };
		const system = { ldapConfig: { lastModifyTimestamp: new Date() } };
		const options = { forceFullSync: true };

		const ldapSchoolSyncer = new LDAPSchoolSyncer(app, stats, {}, system, school, options);
		expect(ldapSchoolSyncer.system.ldapConfig.lastModifyTimestamp).to.be.undefined;
		expect(ldapSchoolSyncer.school.ldapLastSync).to.be.undefined;
	});
});
