const { expect } = require('chai');
const app = require('./../../../src/app');
const { cleanup } = require('../helpers/testObjects')(app);
const { create: createSchool } = require('./../helpers/services/schools')(app);
const { generateRequestParamsFromUser } = require('./../helpers/services/login')(app);
const { create: createUser } = require('./../helpers/services/users')(app);
const { create: createSystem } = require('./../helpers/services/testSystem')(app);
const { create: createYear } = require('./../helpers/services/years');

describe('school maintenance mode', () => {
	const maintenanceService = app.service('schools/:schoolId/maintenance');

	let server;

	before((done) => {
		server = app.listen(0, done);
	});

	after((done) => {
		server.close(done);
	});

	describe('status route', () => {
		describe('for non-LDAP schools', () => {
			it('should give information about the current and next school year', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.find(params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(currentYear._id.toString());
				expect(result.nextYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(false);
			});

			it('should react to the school being in maintenance mode', async () => {
				const currentYear = await createYear();
				const school = await createSchool({ currentYear, inMaintenanceSince: new Date() });
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.find(params);
				expect(result).to.not.equal(undefined);
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(true);
			});
		});

		describe('for LDAP schools', () => {
			it('should work as expected', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				maintenanceService.years = [currentYear, nextYear];
				const ldapSystem = await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});
				const school = await createSchool({ currentYear, systems: [ldapSystem] });
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.find(params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(currentYear._id.toString());
				expect(result.nextYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(true);
				expect(result.maintenance.active).to.equal(false);
			});
		});
	});

	describe('transfer route', () => {
		describe('for non-LDAP schools', () => {
			it('should directly migrate the school to the next school year', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.create({ maintenance: true }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.nextYear).to.equal(undefined);
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(false);
			});
		});

		describe('for LDAP schools', () => {
			it('should enable administrators to start maintenance mode', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				maintenanceService.years = [currentYear, nextYear];
				const ldapSystem = await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});
				const school = await createSchool({ currentYear, systems: [ldapSystem] });
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.create({ maintenance: true }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(currentYear._id.toString());
				expect(result.nextYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(true);
				expect(result.maintenance.active).to.equal(true);
			});

			it('should enable administrators to finish maintenance mode', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				maintenanceService.years = [currentYear, nextYear];
				const ldapSystem = await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});
				const school = await createSchool({
					currentYear,
					systems: [ldapSystem],
					inMaintenanceSince: new Date(),
				});
				const user = await createUser({ schoolId: school._id, roles: 'administrator' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				const result = await maintenanceService.create({ maintenance: false }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.nextYear).to.equal(undefined);
				expect(result.schoolUsesLdap).to.equal(true);
				expect(result.maintenance.active).to.equal(false);
			});
		});
	});

	afterEach(async () => {
		maintenanceService.years = [];
		await cleanup();
	});
});
