import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { schoolEntityFactory, schoolYearEntityFactory } from '@modules/school/testing';
import { ServerTestModule } from '@modules/server';
import { systemEntityFactory } from '@modules/system/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections } from '@testing/cleanup-collections';
import { DateToString } from '@testing/date-to-string';
import { UserAndAccountTestFactory } from '@testing/factory/user-and-account.test.factory';
import { TestApiClient } from '@testing/test-api-client';
import { MaintenanceResponse, SchoolYearResponse } from '../dto';

describe('School Controller (API)', () => {
	let app: INestApplication;
	let em: EntityManager;
	let testApiClient: TestApiClient;

	beforeAll(async () => {
		const moduleFixture = await Test.createTestingModule({
			imports: [ServerTestModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		await app.init();
		em = app.get(EntityManager);
		testApiClient = new TestApiClient(app, 'school');
	});

	beforeEach(async () => {
		await cleanupCollections(em);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('getMaintenanceStatus', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`${someId}/maintenance`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id in params is not a mongo id', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`123/maintenance`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when requested school is not found', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`${someId}/maintenance`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in requested school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 403', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${schoolId}/maintenance`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user is in requested school and the school has an ldap system but is not in maintenance', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[1], systems });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: true,
					maintenance: {
						active: false,
						startDate: undefined,
					},
					currentYear: schoolYearResponses[1],
					nextYear: schoolYearResponses[2],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should return the school maintenance status', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`${schoolId}/maintenance`);

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when user is in requested school and the school has an ldap system and is in maintenance', () => {
			const setup = async () => {
				const inMaintenanceSince = new Date();
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[1], systems, inMaintenanceSince });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: true,
					maintenance: {
						active: true,
						startDate: inMaintenanceSince.toISOString(),
					},
					currentYear: schoolYearResponses[1],
					nextYear: schoolYearResponses[2],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should return the school maintenance status', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`${schoolId}/maintenance`);

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when user is in requested school and the school does not have an ldap system', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withOauthConfig().buildList(1);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[1], systems });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: false,
					maintenance: {
						active: false,
						startDate: undefined,
					},
					currentYear: schoolYearResponses[1],
					nextYear: schoolYearResponses[2],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should return the school maintenance status', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`${schoolId}/maintenance`);

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when user is in requested school and the school is in user migration', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({
					currentYear: schoolYears[1],
					systems,
					inMaintenanceSince: new Date(),
					inUserMigration: true,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: false,
					maintenance: {
						active: false,
						startDate: undefined,
					},
					currentYear: schoolYearResponses[1],
					nextYear: schoolYearResponses[2],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should return the school maintenance status without activated maintenance and without ldap', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`${schoolId}/maintenance`);

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.OK);
			});
		});
	});

	describe('setMaintenanceStatus', () => {
		beforeEach(() => {
			jest.useFakeTimers({ advanceTimers: true }).setSystemTime(new Date('2004-07-01'));
		});

		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.post(`${someId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id in params is not a mongo id', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post(`123/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when requested school is not found', () => {
			const setup = async () => {
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					loggedInClient,
				};
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.post(`${someId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in requested school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin();

				await em.persistAndFlush([school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 403', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when the school is in user migration', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build({ inUserMigration: true, inMaintenanceSince: new Date() });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 422', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when the school is already in next year', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[2] });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 422', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when user is in requested school and the school has no ldap system and maintenance gets activated', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(4);
				const systems = systemEntityFactory.withOauthConfig().buildList(1);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[1], systems });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: false,
					maintenance: {
						active: false,
						startDate: undefined,
					},
					currentYear: schoolYearResponses[2],
					nextYear: schoolYearResponses[3],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should set the school into the next school year', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when user is in requested school and the school has an ldap system and maintenance gets activated', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({ currentYear: schoolYears[1], systems });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: true,
					maintenance: {
						active: true,
						startDate: expect.stringContaining('2004-07-01') as string,
					},
					currentYear: schoolYearResponses[1],
					nextYear: schoolYearResponses[2],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should set the school into maintenance', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when user is in requested school and the school is already in maintenance and maintenance gets activated', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({
					currentYear: schoolYears[1],
					systems,
					inMaintenanceSince: new Date(),
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 422', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: true });

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});

		describe('when user is in requested school and the school is in maintenance and maintenance gets deactivated', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(4);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({
					currentYear: schoolYears[1],
					systems,
					inMaintenanceSince: new Date(),
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const schoolYearResponses: DateToString<SchoolYearResponse>[] = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse: DateToString<MaintenanceResponse> = {
					schoolUsesLdap: true,
					maintenance: {
						active: false,
						startDate: undefined,
					},
					currentYear: schoolYearResponses[2],
					nextYear: schoolYearResponses[3],
				};

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
					expectedResponse,
				};
			};

			it('should set the school into the next year and remove the maintenance', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: false });

				expect(response.body).toEqual(expectedResponse);
				expect(response.status).toEqual(HttpStatus.CREATED);
			});
		});

		describe('when user is in requested school and the school is not in maintenance and maintenance gets deactivated', () => {
			const setup = async () => {
				const schoolYears = schoolYearEntityFactory.withStartYear(2002).buildList(3);
				const systems = systemEntityFactory.withLdapConfig().buildList(1);
				const school = schoolEntityFactory.build({
					currentYear: schoolYears[1],
					systems,
					inMaintenanceSince: undefined,
				});
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([...schoolYears, school, adminAccount, adminUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(adminAccount);

				return {
					schoolId: school.id,
					loggedInClient,
				};
			};

			it('should return 422', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.post(`${schoolId}/maintenance`, { maintenance: false });

				expect(response.status).toEqual(HttpStatus.UNPROCESSABLE_ENTITY);
			});
		});
	});
});
