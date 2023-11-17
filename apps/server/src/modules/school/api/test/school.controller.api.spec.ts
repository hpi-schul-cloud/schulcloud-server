import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { cleanupCollections, TestApiClient } from '@shared/testing';
import {
	federalStateFactory,
	schoolFactory,
	schoolYearFactory,
	UserAndAccountTestFactory,
} from '@shared/testing/factory';
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
				const school = schoolFactory.build();
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
				const schoolYear = schoolYearFactory.build();
				const federalState = federalStateFactory.build();
				const school = schoolFactory.build({ currentYear: schoolYear, federalState });
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent({ school });

				await em.persistAndFlush([schoolYear, federalState, school, studentAccount, studentUser]);
				em.clear();

				const currentYear = {
					id: schoolYear.id,
					name: schoolYear.name,
					startDate: schoolYear.startDate.toISOString(),
					endDate: schoolYear.endDate.toISOString(),
				};

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
					},
					inMaintenance: false,
					isExternal: false,
					currentYear,
					years: {
						schoolYears: [currentYear],
						activeYear: currentYear,
						defaultYear: currentYear,
					},
					features: [],
					systems: [],
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
				const schools = schoolFactory.buildList(3);
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
});
