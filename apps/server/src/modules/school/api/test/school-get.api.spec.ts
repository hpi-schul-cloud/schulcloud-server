import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
	TestApiClient,
	UserAndAccountTestFactory,
	cleanupCollections,
	countyEmbeddableFactory,
	federalStateFactory,
	schoolEntityFactory,
	schoolYearFactory,
	systemEntityFactory,
} from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

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

	describe('getSchool', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`id/${someId}}`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id in params is not a mongo id', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`id/123`);

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
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`id/${someId}`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in requested school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([school, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { schoolId: school.id, loggedInClient };
			};

			it('should return 403', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.get(`id/${schoolId}`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user is in requested school', () => {
			const setup = async () => {
				const schoolYears = schoolYearFactory.withStartYear(2002).buildList(3);
				const currentYear = schoolYears[1];
				const federalState = federalStateFactory.build();
				const county = countyEmbeddableFactory.build();
				const systems = systemEntityFactory.buildList(3);
				const school = schoolEntityFactory.build({ currentYear, federalState, systems, county });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([...schoolYears, federalState, school, studentAccount, studentUser]);
				em.clear();

				const schoolYearResponses = schoolYears.map((schoolYear) => {
					return {
						id: schoolYear.id,
						name: schoolYear.name,
						startDate: schoolYear.startDate.toISOString(),
						endDate: schoolYear.endDate.toISOString(),
					};
				});

				const expectedResponse = {
					id: school.id,
					createdAt: school.createdAt.toISOString(),
					updatedAt: school.updatedAt.toISOString(),
					name: school.name,
					federalState: {
						id: federalState.id,
						name: federalState.name,
						abbreviation: federalState.abbreviation,
						logoUrl: federalState.logoUrl,
						counties: federalState.counties?.map((item) => {
							return {
								id: item._id.toHexString(),
								name: item.name,
								countyId: item.countyId,
								antaresKey: item.antaresKey,
							};
						}),
					},
					county: {
						id: county._id.toHexString(),
						name: county.name,
						countyId: county.countyId,
						antaresKey: county.antaresKey,
					},
					inUserMigration: undefined,
					inMaintenance: false,
					isExternal: false,
					currentYear: schoolYearResponses[1],
					years: {
						schoolYears: schoolYearResponses,
						activeYear: schoolYearResponses[1],
						lastYear: schoolYearResponses[0],
						nextYear: schoolYearResponses[2],
					},
					features: [],
					systemIds: systems.map((system) => system.id),
					// TODO: The feature isTeamCreationByStudentsEnabled is set based on the config value STUDENT_TEAM_CREATION.
					// We need to discuss how to go about the config in API tests!
					instanceFeatures: ['isTeamCreationByStudentsEnabled'],
				};

				const loggedInClient = await testApiClient.login(studentAccount);

				return { schoolId: school.id, loggedInClient, expectedResponse };
			};

			it('should return school', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`id/${schoolId}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});

	describe('getSchoolListForExternalInvite', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const response = await testApiClient.get('list-for-external-invite');

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when a user is logged in', () => {
			const setup = async () => {
				const schools = schoolEntityFactory.buildList(3);
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
				await em.persistAndFlush([...schools, studentAccount, studentUser]);

				const loggedInClient = await testApiClient.login(studentAccount);

				const expectedResponse = schools.map((school) => {
					return {
						id: school.id,
						name: school.name,
						purpose: school.purpose,
					};
				});

				return { loggedInClient, expectedResponse };
			};

			it('should return school list for external invite', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get('list-for-external-invite');

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});

	describe('doesSchoolExist', () => {
		describe('when id in params is not a mongo id', () => {
			it('should return 400', async () => {
				const response = await testApiClient.get(`exists/id/123`);

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['schoolId must be a mongodb id'], field: ['schoolId'] }],
					})
				);
			});
		});

		describe('when id in params is a mongo id', () => {
			it('should work unauthenticated', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`exists/id/${someId}`);

				expect(response.status).toEqual(HttpStatus.OK);
			});
		});

		describe('when requested school is not found', () => {
			it('should return false', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`exists/id/${someId}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ exists: false });
			});
		});

		describe('when requested school is found', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				await em.persistAndFlush(school);

				return { schoolId: school.id };
			};

			it('should return true', async () => {
				const { schoolId } = await setup();

				const response = await testApiClient.get(`exists/id/${schoolId}`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual({ exists: true });
			});
		});
	});

	describe('getSchoolListForLadpLogin', () => {
		it('should work unauthenticated', async () => {
			const response = await testApiClient.get('list-for-ldap-login');

			expect(response.status).toEqual(HttpStatus.OK);
		});

		describe('when no school has an LDAP login system', () => {
			const setup = async () => {
				const schools = schoolEntityFactory.buildList(3);
				await em.persistAndFlush(schools);
			};

			it('should return empty list', async () => {
				await setup();

				const response = await testApiClient.get('list-for-ldap-login');

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual([]);
			});
		});

		describe('when some schools have LDAP login systems', () => {
			const setup = async () => {
				const ldapLoginSystem = systemEntityFactory.build({ type: 'ldap', ldapConfig: { active: true } });
				const schoolWithLdapLoginSystem = schoolEntityFactory.build({ systems: [ldapLoginSystem] });
				const schoolWithoutLdapLoginSystem = schoolEntityFactory.build();
				await em.persistAndFlush([schoolWithLdapLoginSystem, schoolWithoutLdapLoginSystem]);

				const expectedResponse = [
					{
						id: schoolWithLdapLoginSystem.id,
						name: schoolWithLdapLoginSystem.name,
						systems: [{ id: ldapLoginSystem.id, type: ldapLoginSystem.type, alias: ldapLoginSystem.alias }],
					},
				];

				return { expectedResponse };
			};

			it('should return list with these schools', async () => {
				const { expectedResponse } = await setup();

				const response = await testApiClient.get('list-for-ldap-login');

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});

	describe('getSchoolSystems', () => {
		describe('when no user is logged in', () => {
			it('should return 401', async () => {
				const someId = new ObjectId().toHexString();

				const response = await testApiClient.get(`${someId}/systems`);

				expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
			});
		});

		describe('when id in params is not a mongo id', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.get(`123/systems`);

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
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { loggedInClient };
			};

			it('should return 404', async () => {
				const { loggedInClient } = await setup();
				const someId = new ObjectId().toHexString();

				const response = await loggedInClient.get(`${someId}/systems`);

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});

		describe('when user is not in requested school', () => {
			const setup = async () => {
				const school = schoolEntityFactory.build();
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([school, studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				return { schoolId: school.id, loggedInClient };
			};

			it('should return 403', async () => {
				const { schoolId, loggedInClient } = await setup();

				const response = await loggedInClient.get(`${schoolId}/systems`);

				expect(response.status).toEqual(HttpStatus.FORBIDDEN);
			});
		});

		describe('when user is in requested school', () => {
			const setup = async () => {
				const systemWithLdapConfig = systemEntityFactory.build({ type: 'ldap', ldapConfig: { provider: 'LDAP' } });
				const systemWithOauthConfig = systemEntityFactory.build({ type: 'oauth', oauthConfig: { provider: 'Google' } });
				const systemWithoutProvider = systemEntityFactory.build();

				const systems = [systemWithLdapConfig, systemWithOauthConfig, systemWithoutProvider];

				const school = schoolEntityFactory.build({ systems });
				const { adminAccount, adminUser } = UserAndAccountTestFactory.buildAdmin({ school });

				await em.persistAndFlush([school, adminAccount, adminUser]);
				em.clear();

				const expectedResponse = systems.map((system) => {
					return {
						id: system.id,
						type: system.type,
						alias: system.alias,
						ldapConfig: system.ldapConfig ? { provider: system.ldapConfig.provider } : undefined,
						oauthConfig: system.oauthConfig ? { provider: system.oauthConfig.provider } : undefined,
					};
				});

				const loggedInClient = await testApiClient.login(adminAccount);

				return { schoolId: school.id, loggedInClient, expectedResponse };
			};

			it('should return school systems', async () => {
				const { schoolId, loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get(`${schoolId}/systems`);

				expect(response.status).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});
});
