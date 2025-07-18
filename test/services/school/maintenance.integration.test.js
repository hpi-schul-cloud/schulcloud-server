const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ObjectId } = require('mongoose').Types;

const { Forbidden, Unprocessable } = require('../../../src/errors');

const appPromise = require('../../../src/app');
const { setupNestServices, closeNestServices } = require('../../utils/setup.nest.services');
const { cleanup } = require('../helpers/testObjects')(appPromise());
const { create: createSchool } = require('../helpers/services/schools')(appPromise());
const { generateRequestParamsFromUser } = require('../helpers/services/login')(appPromise());
const { create: createUser } = require('../helpers/services/users')(appPromise());
const { create: createSystem } = require('../helpers/services/testSystem')(appPromise());
const { create: createYear } = require('../helpers/services/years');
const { yearModel: Year } = require('../../../src/services/school/model');
const yearLogic = require('../../../src/services/school/logic/year');

chai.use(chaiAsPromised);
const { expect } = chai;

const createName = (year) => {
	return `${year}/${String(year + 1).substring(2, 4)}`;
};

describe('school maintenance mode', () => {
	let app;
	let maintenanceService;

	let server;
	let nestServices;

	before(async () => {
		app = await appPromise();
		maintenanceService = app.service('schools/:schoolId/maintenance');
		server = await app.listen(0);
		nestServices = await setupNestServices(app);
	});

	after(async () => {
		await server.close();
		await closeNestServices(nestServices);
	});

	describe('status route', () => {
		describe('for non-LDAP schools', () => {
			it('should give information about the current and next school year', async () => {
				const currentYear = await createYear();
				const nextYear = await createYear();
				// override years cache  (created on service initialization) with mock years:
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const params = {
					route: { schoolId: school._id.toString() },
				};

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
				const params = {
					route: { schoolId: school._id.toString() },
				};

				const result = await maintenanceService.find(params);
				expect(result).to.not.equal(undefined);
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(true);
			});

			it('should not be in maintenance mode if in school inUserMigration', async () => {
				const currentYear = await createYear();
				const school = await createSchool({ currentYear, inMaintenanceSince: new Date(), inUserMigration: true });
				const params = {
					route: { schoolId: school._id.toString() },
				};

				const result = await maintenanceService.find(params);
				expect(result).to.not.equal(undefined);
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(false);
			});
		});

		describe('for LDAP schools', () => {
			it('should work as expected', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const ldapSystem = await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});
				const school = await createSchool({ currentYear, systems: [ldapSystem] });
				const params = {
					route: { schoolId: school._id.toString() },
				};

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
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const params = {
					route: { schoolId: school._id.toString() },
				};

				const result = await maintenanceService.create({ maintenance: true }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(false);
				expect(result.maintenance.active).to.equal(false);
			});

			it('should allow status requests for all users', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const user = await createUser({ schoolId: school._id, roles: 'teacher' });
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

			it('should not allow status requests for other schools', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });
				const user = await createUser({ schoolId: new ObjectId(), roles: 'teacher' });
				const params = await generateRequestParamsFromUser(user);
				params.route = { schoolId: school._id.toString() };
				params.query = {};

				await expect(maintenanceService.find(params)).to.be.rejectedWith(Forbidden);
			});
		});

		describe('for LDAP schools', () => {
			it('should enable administrators to start maintenance mode', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const ldapSystem = await createSystem({
					type: 'ldap',
					ldapConfig: {
						active: true,
					},
				});
				const school = await createSchool({ currentYear, systems: [ldapSystem] });
				const params = {
					route: { schoolId: school._id.toString() },
				};

				const result = await maintenanceService.create({ maintenance: true }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(currentYear._id.toString());
				expect(result.nextYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(true);
				expect(result.maintenance.active).to.equal(true);
			});

			it('should enable administrators to finish maintenance mode', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
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
				const params = {
					route: { schoolId: school._id.toString() },
				};

				const result = await maintenanceService.create({ maintenance: false }, params);
				expect(result).to.not.equal(undefined);
				expect(result.currentYear._id.toString()).to.equal(nextYear._id.toString());
				expect(result.schoolUsesLdap).to.equal(true);
				expect(result.maintenance.active).to.equal(false);
			});

			it('should only allow administrators to start the new school year', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
				maintenanceService.years = [currentYear, nextYear];
				const school = await createSchool({ currentYear });

				const teacher = await createUser({ schoolId: school._id, roles: 'student' });
				const teacherParams = await generateRequestParamsFromUser(teacher);
				teacherParams.route = { schoolId: school._id.toString() };
				teacherParams.query = {};

				const admin = await createUser({ schoolId: school._id, roles: 'administrator' });
				const adminParams = await generateRequestParamsFromUser(admin);
				adminParams.route = { schoolId: school._id.toString() };
				adminParams.query = {};

				await expect(maintenanceService.create({ maintenance: true }, teacherParams)).to.be.rejectedWith(Forbidden);

				await expect(maintenanceService.create({ maintenance: true }, adminParams)).to.eventually.be.fulfilled;
			}).timeout(5000);

			it('should reject finishing maintenance mode during user migration', async () => {
				const currentYearName = createName(new Date().getFullYear() - 1);
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear());
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
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
					inUserMigration: true,
				});
				const params = {
					route: { schoolId: school._id.toString() },
				};

				await expect(maintenanceService.create({ maintenance: true }, params)).to.be.rejectedWith(Unprocessable);
			});

			it('should reject finishing maintenance mode when already in the next year', async () => {
				const currentYearName = createName(new Date().getFullYear());
				const currentYear = await createYear({
					name: currentYearName,
					startDate: yearLogic.getDefaultStartDate(currentYearName),
					endDate: yearLogic.getDefaultEndDate(currentYearName),
				});
				const nextYearName = createName(new Date().getFullYear() + 1);
				const nextYear = await createYear({
					name: nextYearName,
					startDate: yearLogic.getDefaultStartDate(nextYearName),
					endDate: yearLogic.getDefaultEndDate(nextYearName),
				});
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
				const params = {
					route: { schoolId: school._id.toString() },
				};

				await expect(maintenanceService.create({ maintenance: true }, params)).to.be.rejectedWith(Unprocessable);
			});
		});
	});

	it('should only allow find and create', async () => {
		for (const method of ['find', 'create']) {
			expect(maintenanceService[method]).to.exist;
		}
		for (const method of ['get', 'update', 'patch', 'remove']) {
			expect(maintenanceService[method]).to.not.exist;
		}
	});

	afterEach(async () => {
		maintenanceService.years = [];
		await cleanup();
	});
});
