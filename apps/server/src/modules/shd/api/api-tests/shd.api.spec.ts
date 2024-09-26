import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { InstanceEntity } from '@modules/instance';
import { instanceEntityFactory } from '@modules/instance/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { LoginDto } from '@src/modules/authentication';
import { TargetUserIdParams } from '../dtos/target-user-id.params';

const forbiddenResponse = {
	code: 403,
	message: 'Forbidden',
	title: 'Forbidden',
	type: 'FORBIDDEN',
};

const unauthorizedReponse = {
	code: 401,
	type: 'UNAUTHORIZED',
	title: 'Unauthorized',
	message: 'Unauthorized',
};

describe('Shd API', () => {
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
		testApiClient = new TestApiClient(app, 'shd');
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await em.nativeDelete(InstanceEntity, {});
	});

	describe('supportJwt', () => {
		const prepareData = () => {
			const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero();
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const instance = instanceEntityFactory.build();

			return { superheroAccount, superheroUser, studentAccount, studentUser, instance };
		};

		describe('given unprivileged user want to access', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser, studentAccount, studentUser, instance } = prepareData();

				await em.persistAndFlush([superheroAccount, superheroUser, studentAccount, studentUser, instance]);
				em.clear();

				const data: TargetUserIdParams = {
					userId: superheroUser.id,
				};

				const loggedInClient = await testApiClient.login(studentAccount);

				return { data, loggedInClient };
			};

			describe('when jwt is not passed', () => {
				it('should respond with unauthorized exception', async () => {
					const { data } = await setup();

					const response = await testApiClient.post('supportJwt', data);

					expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
					expect(response.body).toEqual(unauthorizedReponse);
				});
			});

			describe('when user has not the privilege to request supportJwt', () => {
				it('should respond with unauthorized exception', async () => {
					const { data, loggedInClient } = await setup();

					const response = await loggedInClient.post('supportJwt', data);

					expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
					expect(response.body).toEqual(forbiddenResponse);
				});
			});
		});

		describe('given privileged user want to access', () => {
			const setup = async (userId?: string) => {
				const { superheroAccount, superheroUser, studentAccount, studentUser, instance } = prepareData();

				await em.persistAndFlush([superheroAccount, superheroUser, studentAccount, studentUser, instance]);
				em.clear();

				const data: TargetUserIdParams = {
					userId: userId ?? studentUser.id,
				};

				const loggedInClient = await testApiClient.login(superheroAccount);

				return { data, loggedInClient };
			};

			describe('when requested user exists', () => {
				it('should respond with loginDto', async () => {
					const { data, loggedInClient } = await setup();

					const response = await loggedInClient.post('supportJwt', data);

					expect(response.statusCode).toEqual(HttpStatus.CREATED);
					expect(response.body).toMatchObject<LoginDto>({
						accessToken: expect.any(String),
					});
				});
			});

			describe('when requested user not exists', () => {
				it('should return 404', async () => {
					const notExistedUserId = new ObjectId().toHexString();
					const { data, loggedInClient } = await setup(notExistedUserId);

					const response = await loggedInClient.post(`/supportJwt`, data);

					expect(response.status).toEqual(HttpStatus.NOT_FOUND);
					expect(response.body).toEqual({
						code: 404,
						message: expect.any(String),
						title: 'Not Found',
						type: 'NOT_FOUND',
					});
				});
			});

			describe('when invalid data passed', () => {
				it('should return 400', async () => {
					const invalidUserId = 'someId';
					const { data, loggedInClient } = await setup(invalidUserId);

					const response = await loggedInClient.post(`/supportJwt`, data);

					expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
					expect(response.body).toEqual(
						expect.objectContaining({
							validationErrors: [{ errors: ['userId must be a mongodb id'], field: ['userId'] }],
						})
					);
				});
			});
		});
	});
});
