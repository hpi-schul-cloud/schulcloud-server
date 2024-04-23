import { EntityManager } from '@mikro-orm/mongodb';
import { AccountEntity } from '@modules/account/entity/account.entity';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@shared/domain/entity';
import { schoolEntityFactory, TestApiClient, UserAndAccountTestFactory } from '@shared/testing';
import { ServerTestModule } from '@src/modules/server';
import { MeResponse } from '../dto';

const mapToMeResponseObject = (user: User, account: AccountEntity, permissions: string[]): MeResponse => {
	const roles = user.getRoles();
	const role = roles[0];
	const { school } = user;

	const meResponseObject: MeResponse = {
		school: {
			id: school.id,
			name: school.name,
			logo: {},
		},
		user: {
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
		},
		roles: [
			{
				id: role.id,
				name: role.name,
			},
		],
		permissions,
		account: {
			id: account.id,
		},
	};

	return meResponseObject;
};

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
			it('should respond with unauthorized exception', async () => {
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
			describe('when user is a student', () => {
				const setup = async () => {
					// The LERNSTORE_VIEW permission on the school is set here as an example. See the unit tests for all variations.
					const school = schoolEntityFactory.build({ permissions: { student: { LERNSTORE_VIEW: true } } });
					const { studentAccount: account, studentUser: user } = UserAndAccountTestFactory.buildStudent({ school });

					await em.persistAndFlush([account, user]);
					em.clear();

					const loggedInClient = await testApiClient.login(account);
					const expectedPermissions = user.resolvePermissions();
					const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

					return { loggedInClient, expectedResponse };
				};

				it('should respond with "me" information and status code 200', async () => {
					const { loggedInClient, expectedResponse } = await setup();

					const response = await loggedInClient.get();

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual(expectedResponse);
				});
			});

			describe('when user is a teacher', () => {
				const setup = async () => {
					const { teacherAccount: account, teacherUser: user } = UserAndAccountTestFactory.buildTeacher();

					await em.persistAndFlush([account, user]);
					em.clear();

					const loggedInClient = await testApiClient.login(account);
					const expectedPermissions = user.resolvePermissions();
					const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

					return { loggedInClient, expectedResponse };
				};

				it('should respond with "me" information and status code 200', async () => {
					const { loggedInClient, expectedResponse } = await setup();

					const response = await loggedInClient.get();

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual(expectedResponse);
				});
			});

			describe('when user is an admin', () => {
				const setup = async () => {
					const { adminAccount: account, adminUser: user } = UserAndAccountTestFactory.buildAdmin();

					await em.persistAndFlush([account, user]);
					em.clear();

					const loggedInClient = await testApiClient.login(account);
					const expectedPermissions = user.resolvePermissions();
					const expectedResponse = mapToMeResponseObject(user, account, expectedPermissions);

					return { loggedInClient, expectedResponse };
				};

				it('should respond with "me" information and status code 200', async () => {
					const { loggedInClient, expectedResponse } = await setup();

					const response = await loggedInClient.get();

					expect(response.statusCode).toEqual(HttpStatus.OK);
					expect(response.body).toEqual(expectedResponse);
				});
			});
		});
	});
});
