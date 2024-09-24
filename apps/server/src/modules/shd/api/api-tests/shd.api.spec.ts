import { EntityManager, ObjectId } from '@mikro-orm/mongodb';
import { InstanceEntity } from '@modules/instance';
import { instanceEntityFactory } from '@modules/instance/testing';
import { ServerTestModule } from '@modules/server';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@shared/domain/interface';
import { TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { LoginDto } from '@src/modules/authentication';
import { TargetUserIdParams } from '../dtos/target-user-id.params';

const forbiddenResponse = {
	code: 403,
	message: 'Forbidden',
	title: 'Forbidden',
	type: 'FORBIDDEN',
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
		const prepareData = (superheroPermissions?: Permission[]) => {
			const { superheroAccount, superheroUser } = UserAndAccountTestFactory.buildSuperhero({}, superheroPermissions);
			const { studentAccount, studentUser } = UserAndAccountTestFactory.buildStudent();
			const instance = instanceEntityFactory.build();

			return { superheroAccount, superheroUser, studentAccount, studentUser, instance };
		};

		describe('when id in params is not a mongo id', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser } = prepareData();

				await em.persistAndFlush([superheroAccount, superheroUser]);
				em.clear();

				const loggedInClient = await testApiClient.login(superheroAccount);

				return { loggedInClient };
			};

			it('should return 400', async () => {
				const { loggedInClient } = await setup();

				const response = await loggedInClient.post(`/supportJwt`, { userId: 'someId' });

				expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
				expect(response.body).toEqual(
					expect.objectContaining({
						validationErrors: [{ errors: ['userId must be a mongodb id'], field: ['userId'] }],
					})
				);
			});
		});

		describe('when no jwt is passed', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser, studentAccount, studentUser, instance } = prepareData();

				await em.persistAndFlush([superheroAccount, superheroUser, studentAccount, studentUser, instance]);
				em.clear();

				const data: TargetUserIdParams = {
					userId: studentUser.id,
				};

				return { data };
			};

			it('should respond with unauthorized exception', async () => {
				const { data } = await setup();

				const response = await testApiClient.post('supportJwt', data);

				expect(response.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
				expect(response.body).toEqual({
					type: 'UNAUTHORIZED',
					title: 'Unauthorized',
					message: 'Unauthorized',
					code: 401,
				});
			});
		});

		describe('when unprivileged user want to access', () => {
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

			it('should respond with unauthorized exception', async () => {
				const { data, loggedInClient } = await setup();

				const response = await loggedInClient.post('supportJwt', data);

				expect(response.statusCode).toEqual(HttpStatus.FORBIDDEN);
				expect(response.body).toEqual(forbiddenResponse);
			});
		});

		describe('when privileged user want to access', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser, studentAccount, studentUser, instance } = prepareData([
					Permission.CREATE_SUPPORT_JWT,
				]);

				await em.persistAndFlush([superheroAccount, superheroUser, studentAccount, studentUser, instance]);
				em.clear();

				const data: TargetUserIdParams = {
					userId: studentUser.id,
				};

				const loggedInClient = await testApiClient.login(superheroAccount);

				return { data, loggedInClient };
			};

			it('should respond with loginDto', async () => {
				const { data, loggedInClient } = await setup();

				const response = await loggedInClient.post('supportJwt', data);

				expect(response.statusCode).toEqual(HttpStatus.CREATED);
				expect(response.body).toMatchObject<LoginDto>({
					accessToken: expect.any(String),
				});
			});
		});

		describe('when target user is not found', () => {
			const setup = async () => {
				const { superheroAccount, superheroUser, studentAccount, studentUser, instance } = prepareData([
					Permission.CREATE_SUPPORT_JWT,
				]);

				await em.persistAndFlush([superheroAccount, superheroUser, studentAccount, studentUser, instance]);
				em.clear();

				const data: TargetUserIdParams = {
					userId: studentUser.id,
				};

				const loggedInClient = await testApiClient.login(superheroAccount);
				const someId = new ObjectId().toHexString();

				return { data, loggedInClient, someId };
			};

			it('should return 404', async () => {
				const { loggedInClient, someId } = await setup();

				const response = await loggedInClient.post(`/supportJwt`, { userId: someId });

				expect(response.status).toEqual(HttpStatus.NOT_FOUND);
			});
		});
	});
});
