import { EntityManager } from '@mikro-orm/mongodb';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';

describe('Me Controller (API)', () => {
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
		testApiClient = new TestApiClient(app, 'me');
	});

	afterAll(async () => {
		await app.close();
	});

	describe('me', () => {
		describe('when no jwt is passed', () => {
			it('should response with unauthorized exception', async () => {
				const response = await testApiClient.get();

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when valid jwt is passed', () => {
			const setup = async () => {
				const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();

				await em.persistAndFlush([studentAccount, studentUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(studentAccount);

				const permissions = studentUser.resolvePermissions();
				const roles = studentUser.getRoles();

				const expectedResponse = {
					school: {
						id: studentUser.school.id,
					},
					user: {
						id: studentUser.id,
					},
					roles: [
						{
							id: roles[0].id,
						},
					],
					permissions,
				};

				return { loggedInClient, studentUser, expectedResponse };
			};

			it('should response with "me" information and status code 200', async () => {
				const { loggedInClient, expectedResponse } = await setup();

				const response = await loggedInClient.get();

				expect(response.statusCode).toEqual(HttpStatus.OK);
				expect(response.body).toEqual(expectedResponse);
			});
		});
	});
});
